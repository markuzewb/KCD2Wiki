#!/usr/bin/env python3
"""Rematch already installed KCD2 images after importing a fresh RP item catalogue.
No dependencies; does not change articles, uploaded item media, maps or secrets.
Usage: python3 tools/rebuild_icon_map.py [--catalog PATH]
"""
from pathlib import Path
from collections import Counter,defaultdict
import argparse,json,re
parser=argparse.ArgumentParser()
parser.add_argument('--catalog',help='Optional game-catalog.json; default catalog/game-catalog.json')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
catfile=Path(args.catalog).resolve() if args.catalog else root/'catalog/game-catalog.json'
catalog=json.loads(catfile.read_text(encoding='utf8'))
icons=json.loads((root/'catalog/icons.json').read_text(encoding='utf8'))
assert isinstance(catalog.get('items'),list) and isinstance(icons.get('icons'),list)
lookup={r['id'].casefold():r for r in icons['icons'] if r['category']=='items'}
normalize=lambda text:re.sub('[^a-z0-9]','',text.casefold())
normalized=defaultdict(list)
for row in lookup.values():normalized[normalize(row['id'])].append(row)
matched={};count=Counter();missing=0
for item in catalog['items']:
 guid=str(item.get('id','')).lower();internal=str(item.get('internal') or '')
 if not re.fullmatch(r'[a-f0-9-]{36}',guid):continue
 icon=lookup.get(internal.casefold());kind='exact' if icon else None
 if not icon:
  candidates=normalized[normalize(internal)]
  if len(candidates)==1:icon=candidates[0];kind='normalized'
 if not icon:
  root_name=re.sub(r'(?i)_(medium|best|small|large|poor|good|weak|strong|quality[0-9]+)$','',internal)
  if root_name!=internal and root_name.casefold().startswith(('potion_','perfume_','sleepingpoison','poison','antidote')):
   icon=lookup.get(root_name.casefold())
   if icon is None:
    candidates=normalized[normalize(root_name)]
    if len(candidates)==1:icon=candidates[0]
   if icon:kind='shared-variant'
 if icon:
  matched[guid]={'path':icon['path'],'match':kind,'iconId':icon['id']};count[kind]+=1
 else:missing+=1
result={'schema':1,'source':'KCD2 icons from provided icons.rar; conservative internal-class matching',
 'itemCount':len(catalog['items']),'matchedCount':len(matched),'counts':dict(count),'items':matched}
output=root/'catalog/item-icon-map.json'
output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(f'Matched {len(matched)} of {len(catalog["items"])} items. By method: {dict(count)}. No match: {missing}.')
print('Updated',output)
