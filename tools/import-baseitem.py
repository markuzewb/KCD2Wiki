#!/usr/bin/env python3
"""Import item and animation data from the KCD2BaseItem project into the wiki catalog.

Usage: python3 tools/import-baseitem.py /path/to/KCD2BaseItem-clone

Reads (from the KCD2BaseItem clone):
  data/reference/items_full.json  — full item database (ru/en names, categories, stats)
  data/reference/anim_items.json  — packed animation reference with Russian descriptions
  data/reference/anim_cats.json   — animation category labels
  data/icons.json + assets/icons/sheet-*.webp — 64px game icon sprite sheets

Writes (in this repository):
  public/icons/game/<icon>.webp   — individual game icons cropped from the sheets
  catalog/game-catalog.json       — items merged with KCD2BaseItem data (recipes untouched)
  catalog/item-icon-map.json      — item GUID -> game icon path
  catalog/animations.json         — clips enriched with Russian names/descriptions
"""
import json, re, sys, uuid
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/kcd2baseitem')
ANIMS_ONLY = '--anims-only' in sys.argv

CAT_SLUGS = {
    0: 'alchemy', 1: 'ammo', 2: 'armor', 3: 'melee', 4: 'ranged', 5: 'horse',
    6: 'food', 7: 'books', 8: 'dice', 9: 'materials', 10: 'valuables',
    11: 'keys', 12: 'tools', 13: 'household', 14: 'world', 15: 'misc',
}

def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)

def dump(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', path)

full = load(SRC / 'data/reference/items_full.json')
icon_pack = load(SRC / 'data/icons.json')
cats_full = {c['id']: c['ru'] for c in load(SRC / 'data/reference/cats_full.json')}
cell, sheets, icon_pos = icon_pack['cell'], icon_pack['sheets'], icon_pack['icons']

if not ANIMS_ONLY:
    # ---------------------------------------------------------------- icons ----
    out_icons = ROOT / 'public/icons/game'
    out_icons.mkdir(parents=True, exist_ok=True)
    used = sorted({i['icon'] for i in full if i['icon'] in icon_pos})
    sheet_cache = {}
    names = {}  # icon id -> file name (lowercase, collision-safe)
    taken = set()
    for icon in used:
        base = icon.lower()
        assert re.fullmatch(r'[a-z0-9_.-]+', base), icon
        name = base
        n = 2
        while name in taken:
            name = f'{base}~{n}'
            n += 1
        taken.add(name)
        names[icon] = name + '.webp'
        sheet_i, x, y = icon_pos[icon]  # sheet index is 0-based
        sheet_file = sheets[sheet_i]
        if sheet_file not in sheet_cache:
            sheet_cache[sheet_file] = Image.open(SRC / 'assets/icons' / sheet_file).convert('RGBA')
        tile = sheet_cache[sheet_file].crop((x, y, x + cell, y + cell))
        tile.save(out_icons / names[icon], 'WEBP', quality=90, method=6)
    print(f'icons: {len(used)} cropped from {len(sheet_cache)} sheets')

    # ---------------------------------------------------------------- items ----
    catalog = load(ROOT / 'catalog/game-catalog.json')
    ours = {i['id'].lower(): i for i in catalog['items']}
    merged = []
    def item_order(r):
        name = r['ru'] or r['en'] or r['name'] or ''
        return (1 if 'в игре не назван' in name else 0, name.lower(), r['id'])

    for row in sorted(full, key=item_order):
        old = ours.get(row['id'].lower())
        item = dict(old) if old else {
            'id': row['id'], 'name': row['ru'] or row['en'] or row['name'],
            'referencePrice': None, 'recipeOutputs': 0, 'recipeUses': 0,
        }
        item['english'] = row['en'] or item.get('english') or None
        item['internal'] = row['name'] or item.get('internal') or None
        item['category'] = CAT_SLUGS[row['cat']]
        item['categoryName'] = cats_full[row['cat']]
        item['subName'] = row.get('subLabel') or None
        item['weight'] = row['weight']
        item['gamePrice'] = row['price']
        item['stats'] = [[s['k'], s['v'], s.get('u') or '', s.get('g') or ''] for s in row['extra']]
        item['icon'] = row['icon'] if row['icon'] in icon_pos else None
        merged.append(item)
    assert len(merged) == len({i['id'].lower() for i in merged})
    cat_counts = {}
    for i in merged:
        cat_counts[i['category']] = cat_counts.get(i['category']) or [i['categoryName'], 0]
        cat_counts[i['category']][1] += 1
    meta = catalog['meta']
    meta['itemCount'] = len(merged)
    CAT_ORDER = ['melee', 'ranged', 'ammo', 'armor', 'horse', 'alchemy', 'food', 'books',
                 'dice', 'valuables', 'keys', 'tools', 'materials', 'household', 'world', 'misc']
    CAT_ICONS = {'alchemy': '🌿', 'ammo': '🏹', 'armor': '🛡️', 'melee': '⚔️', 'ranged': '🔫',
                 'horse': '🐎', 'food': '🍖', 'books': '📜', 'dice': '🎲', 'materials': '🔨',
                 'valuables': '💎', 'keys': '🗝️', 'tools': '🔧', 'household': '🏠', 'world': '🗺️', 'misc': '🎒'}
    meta['itemCategories'] = [[slug, cat_counts[slug][0], cat_counts[slug][1], CAT_ICONS[slug]]
                              for slug in CAT_ORDER if slug in cat_counts]
    meta['baseItemSource'] = 'KCD2BaseItem (markuzewb) — полная база предметов и игровых иконок KCD2'
    meta['baseItemImportedAt'] = '2026-11-14T00:00:00Z'
    catalog['items'] = merged
    dump(ROOT / 'catalog/game-catalog.json', catalog)
    print('items:', len(merged), 'with game icon:', sum(1 for i in merged if i['icon']))

    # ------------------------------------------------------------- icon map ----
    old_map = load(ROOT / 'catalog/item-icon-map.json')
    PLACEHOLDER = '/icons/game/_placeholder.webp'
    entries = {}
    counts = {}
    for i in merged:
        key = i['id'].lower()
        if i['icon']:
            entries[key] = {'path': '/icons/game/' + names[i['icon']], 'match': 'game-icon', 'iconId': i['icon']}
        elif key in old_map['items']:
            entries[key] = old_map['items'][key]
        else:
            entries[key] = {'path': PLACEHOLDER, 'match': 'placeholder', 'iconId': None}
        counts[entries[key]['match']] = counts.get(entries[key]['match'], 0) + 1
    dump(ROOT / 'catalog/item-icon-map.json', {
        **old_map,
        'source': 'KCD2BaseItem sprite sheets + legacy icons.rar matches',
        'itemCount': len(merged),
        'matchedCount': sum(1 for e in entries.values() if e['match'] != 'placeholder'),
        'counts': counts,
        'items': entries,
    })
    print('icon map:', counts)

# ----------------------------------------------------------- animations ----
anims = load(ROOT / 'catalog/animations.json')
pack = load(SRC / 'data/reference/anim_items.json')
cats_rows = load(SRC / 'data/reference/anim_cats.json')
anim_subs = load(SRC / 'data/reference/anim_subs.json')
anim_cats = {c['id']: c for c in cats_rows}
sub_labels = {}
for cat_id, rows in anim_subs.items():
    for row in rows:
        sub_labels[(int(cat_id), row['key'])] = row['label']
ru, desc, phase, fam = pack['ru'], pack['desc'], pack['phase'], pack['fam']
frag, trust, pose, kinds = pack['frag'], pack['trust'], pack['pose'], pack['kind']
by_clip = {}
for r in pack['items']:
    num, ru_i, de_i, ph_i, fa_i, fr_i, tr_i, det, clip, cat_id, sub, pose_i, kind_i = (r + [0])[:13]
    cat = anim_cats.get(cat_id) or {}
    by_clip[clip] = {
        'ru': ru[ru_i], 'desc': desc[de_i], 'phase': phase[ph_i],
        'cat': cat.get('ru', ''), 'catIcon': cat.get('icon', ''),
        'sub': sub_labels.get((cat_id, sub), '') if sub else '',
        'pose': pose[pose_i] if pose_i < len(pose) else '',
        'kind': kinds[kind_i] if kind_i < len(kinds) else 'action',
        'tags': det if isinstance(det, list) else [],
    }
hit = 0
for clip in anims['clips']:
    extra = by_clip.get(clip['clip'])
    if extra:
        hit += 1
        clip.update(extra)
# Category reference for the filter UI (pose pseudo-category excluded: pose chips cover it).
anims['catalog'] = [
    {'name': c['ru'], 'icon': c.get('icon', ''), 'count': c.get('count', 0),
     'subs': [[row['label'], row['count']] for row in anim_subs.get(str(c['id']), [])]}
    for c in cats_rows if not c.get('pose')
]
anims['source'] = 'https://docs.kcd-mp.com/reference/animations/ + KCD2BaseItem (русские названия, описания и классификация)'
anims['baseItemImportedAt'] = '2026-11-14T00:00:00Z'
dump(ROOT / 'catalog/animations.json', anims)
print('animations enriched:', hit, '/', len(anims['clips']), '| cats:', len(anims['catalog']))
