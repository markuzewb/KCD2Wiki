#!/usr/bin/env python3
"""Build a read-only KCD2RP Wiki item/recipe catalogue from server-side exports.

No game client or database connection is required. Run on a trusted server archive
or extracted gamemode files. Native GUID validation is NOT performed here;
'catalog_' recipes are labelled candidates, not proven active on live KCD2RP.
"""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
import tarfile
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
NAME_FILE = 'ui/admin/npc-item-names-ru.js'
MODULE_FILES = ['craft_data.lua', 'native_craft_data.lua', 'craft_catalog.lua']


def extract_archive(archive, root):
    wanted = {f'gamemodes/localrp/server/modules/{f}' for f in MODULE_FILES}
    wanted.add(f'gamemodes/localrp/{NAME_FILE}')
    with tarfile.open(archive, 'r:*') as tar:
        found = set()
        for member in tar:
            if member.name not in wanted or not member.isfile():
                continue
            dest = root / member.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(member) as inp, dest.open('wb') as out:
                import shutil
                shutil.copyfileobj(inp, out)
            found.add(member.name)
        missing = wanted - found
        if missing:
            raise ValueError('В архиве не найдены необходимые файлы: ' + ', '.join(sorted(missing)))
    return root / 'gamemodes/localrp'


def js_array(text, name):
    match = re.search(r'const\s+' + name + r'\s*=\s*(\[[^;]+\]);', text, re.S)
    if not match:
        raise ValueError(f'Не найден массив {name} в каталоге названий')
    return json.loads(match.group(1))


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def safe_string(value):
    return str(value if value is not None else '').strip()


def normalized_id(value):
    return safe_string(value).lower()


def generate(gamemode, output, source_label=None):
    game = pathlib.Path(gamemode)
    namesfile = game / NAME_FILE
    modules = game / 'server/modules'
    for p in [namesfile, *[modules / f for f in MODULE_FILES]]:
        if not p.is_file():
            raise FileNotFoundError(f'Не найден источник: {p}')
    with tempfile.TemporaryDirectory() as tmp:
        tables_path = pathlib.Path(tmp) / 'craft_tables.json'
        subprocess.run(['texlua', '--luaonly', str(HERE / 'export_craft.lua'), str(modules), str(tables_path)], check=True, timeout=45)
        source = json.loads(tables_path.read_text(encoding='utf-8'))

    item_js = namesfile.read_text(encoding='utf-8')
    names = js_array(item_js, 'names')
    raw_rows = js_array(item_js, 'rows')
    items_by_guid = {}
    guid_pattern = re.compile('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    for guid, internal, english, name_index in raw_rows:
        guid = normalized_id(guid)
        if not guid_pattern.fullmatch(guid):
            continue
        name = names[name_index] if type(name_index) is int and 0 <= name_index < len(names) else ''
        existing = items_by_guid.get(guid)
        if not existing:
            items_by_guid[guid] = {'id': guid, 'name': safe_string(name or english or internal or guid),
                                   'english': safe_string(english), 'internal': safe_string(internal)}
        elif not existing['name'] and name:
            existing['name'] = safe_string(name)
    goods = source.get('goods') or {}
    rp_guids = {}
    for key, good in goods.items():
        if not isinstance(good, dict):
            continue
        guid = normalized_id(good.get('class'))
        if guid_pattern.fullmatch(guid):
            rp_guids[key] = guid

    # Native prices were exported by the server. Not necessarily current market prices.
    native = source.get('nativeCraftItems') or {}
    for guid, item in items_by_guid.items():
        d = native.get(guid)
        if isinstance(d, dict) and number(d.get('price')) is not None:
            item['referencePrice'] = d['price']
            item['priceSource'] = 'native_craft_data'

    # A few special RP goods have a GUID but distinct RP names. Preserve that
    # distinction on recipes; do not rewrite the exact-game item name by GUID.
    by_key = {key: g for key, g in goods.items() if isinstance(g, dict)}
    def describe_rp_good(key):
        good = by_key.get(key) or {}
        if good:
            return {'id': rp_guids.get(key, ''), 'name': safe_string(good.get('name') or key), 'key': key, 'exists': rp_guids.get(key, '') in items_by_guid}
        return {'id': '', 'name': key, 'key': key, 'exists': False}

    def describe_guid(guid):
        guid = normalized_id(guid)
        name = items_by_guid.get(guid, {}).get('name') or native.get(guid, {}).get('name') or guid
        return {'id': guid, 'name': name, 'exists': guid in items_by_guid}

    recipes = []
    for key, recipe in sorted((source.get('recipes') or {}).items()):
        if not isinstance(recipe, dict):
            continue
        craft = safe_string(recipe.get('craft'))
        rp_output = describe_rp_good(recipe.get('output', ''))
        ingredients = [dict(describe_rp_good(itemkey), amount=amount)
                       for itemkey, amount in sorted((recipe.get('ingredients') or {}).items())]
        candidate = key.startswith('catalog_')
        recipes.append({
            'id': key, 'name': rp_output['name'], 'craft': craft,
            'craftName': source.get('craftNames', {}).get(craft, craft),
            'kind': 'catalog-candidate' if candidate else 'rp',
            'output': rp_output, 'outputs': [rp_output], 'amount': recipe.get('amount', 1),
            'level': recipe.get('level'), 'seconds': recipe.get('seconds'),
            'fee': recipe.get('fee'), 'xp': recipe.get('xp'),
            'documentPrice': recipe.get('documentPrice'),
            'ingredients': ingredients,
            'availability': 'requires-server-guid-check' if candidate else 'defined-in-rp-data',
        })
    for key, recipe in sorted((source.get('nativeRecipes') or {}).items()):
        if not isinstance(recipe, dict):
            continue
        output_guids = recipe.get('outputs') or []
        outputs = [describe_guid(g) for g in output_guids]
        craft = safe_string(recipe.get('craft'))
        ingredients = [dict(describe_guid(g), amount=amount)
                       for g, amount in sorted((recipe.get('inputs') or {}).items())]
        recipes.append({
            'id': key, 'name': outputs[0]['name'] if outputs else key,
            'craft': craft, 'craftName': source.get('craftNames', {}).get(craft, craft),
            'kind': 'native', 'output': outputs[0] if outputs else None,
            'outputs': outputs, 'amount': 1, 'level': recipe.get('level'),
            'seconds': recipe.get('seconds'), 'fee': recipe.get('fee'), 'xp': recipe.get('xp'),
            'ingredients': ingredients, 'availability': 'native-craft-export'
        })

    result_of, ingredient_of = {}, {}
    for recipe in recipes:
        for produced in recipe['outputs']:
            guid = produced.get('id')
            if guid:
                result_of[guid] = result_of.get(guid, 0) + 1
        for ingredient in recipe['ingredients']:
            guid = ingredient.get('id')
            if guid:
                ingredient_of[guid] = ingredient_of.get(guid, 0) + 1
    for item in items_by_guid.values():
        item['recipeOutputs'] = result_of.get(item['id'], 0)
        item['recipeUses'] = ingredient_of.get(item['id'], 0)

    items = sorted(items_by_guid.values(), key=lambda item: (item['name'].casefold(), item['id']))
    recipes.sort(key=lambda item: (item['name'].casefold(), item['id']))
    kind_counts = {}
    for r in recipes:
        kind_counts[r['kind']] = kind_counts.get(r['kind'], 0) + 1
    sha = {str(p.relative_to(game)): hashlib.sha256(p.read_bytes()).hexdigest()
           for p in [namesfile, *[modules / f for f in MODULE_FILES]]}
    meta = {
        'source': 'KCD2RP server gamemode export + Russian item-name mapping',
        'sourceArchive': source_label or 'Локальные файлы игрового режима',
        'importedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'note': 'Справочник собран из экспортированных таблиц. Не является проверкой доступности рецептов на работающем сервере. Справочные цены не являются ценами магазинов.',
        'candidateNote': 'Дополнительные рецепты catalog_ проходят проверку GUID на игровом сервере; в Wiki они показаны как кандидаты.',
        'sourceHashes': sha,
        'itemCount': len(items), 'recipeCount': len(recipes), 'recipeKinds': kind_counts,
        'craftNames': source.get('craftNames', {}),
        'nativePrices': sum('referencePrice' in x for x in items),
    }
    catalog = {'meta': meta, 'items': items, 'recipes': recipes}
    output = pathlib.Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'items':len(items),'recipes':len(recipes),'kinds':kind_counts,'nativePrices':meta['nativePrices'],'out':str(output)}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description='Import KCD2RP gamemode item and recipe exports for Wiki')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--gamemode', help='Path to extracted gamemodes/localrp')
    group.add_argument('--archive', help='Path to trusted server .tgz archive')
    parser.add_argument('--out', default=str(HERE.parent / 'catalog/game-catalog.json'), help='Output catalog JSON')
    args = parser.parse_args()
    if args.archive:
        with tempfile.TemporaryDirectory() as tmp:
            generate(extract_archive(args.archive, pathlib.Path(tmp)), args.out, pathlib.Path(args.archive).name)
    else:
        generate(args.gamemode, args.out)

if __name__ == '__main__':
    main()
