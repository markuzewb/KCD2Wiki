#!/usr/bin/env python3
"""Generate standalone offline viewer with game catalog (read-only)."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
seed=json.loads((root/'seed.json').read_text(encoding='utf-8'))
catalog=json.loads((root/'catalog/game-catalog.json').read_text(encoding='utf-8'))
animations=json.loads((root/'catalog/animations.json').read_text(encoding='utf-8'))
icons=json.loads((root/'catalog/icons.json').read_text(encoding='utf-8'))
iconmatches=json.loads((root/'catalog/item-icon-map.json').read_text(encoding='utf-8'))
from collections import Counter
animations['families']=dict(Counter(f for c in animations['clips'] for f in c.get('families',[])))
source=(root/'public/app.js').read_text(encoding='utf-8')
css=(root/'public/style.css').read_text(encoding='utf-8')+(root/'public/wiki-icons.css').read_text(encoding='utf-8')
react=(root/'public/vendor/react.min.js').read_text(encoding='utf-8')
reactdom=(root/'public/vendor/react-dom.min.js').read_text(encoding='utf-8')
extra=(root/'public/wiki-extra.js').read_text(encoding='utf-8')
iconjs=(root/'public/wiki-icons.js').read_text(encoding='utf-8')
def inline(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
mock=r'''(function(){
 const db=window.WikiDemoData,catalog=window.WikiDemoCatalog,animations=window.WikiDemoAnimations;
 const icons=window.WikiDemoIcons,iconmatches=window.WikiDemoItemIconMatches;
 const imageUrl=id=>id&&iconmatches.items[String(id).toLowerCase()]?.path?'.'+iconmatches.items[String(id).toLowerCase()].path:null;
 const itemWithIcon=x=>({...x,imageUrl:imageUrl(x.id),iconMatch:iconmatches.items[String(x.id).toLowerCase()]?.match||null});
 const recipeWithIcon=r=>({...r,outputImageUrl:imageUrl(r.output?.id)});
 const response=(d,ok=true)=>Promise.resolve({ok,json:()=>Promise.resolve(d)});
 const text=x=>String(x||'').toLocaleLowerCase('ru-RU');
 window.fetch=async function(href,opts={}){
  if(opts.method&&opts.method!=='GET')return response({error:'В автономном просмотре изменение содержимого недоступно.'},false);
  const url=new URL(href,'https://wiki.local');const q=url.searchParams;
  if(url.pathname==='/api/content')return response(db);
  if(url.pathname==='/api/icons/meta')return response({total:icons.total,categories:icons.categories,matched:iconmatches.matchedCount,itemsInCatalog:iconmatches.itemCount,matchTypes:iconmatches.counts});
  if(url.pathname==='/api/icons'){
   const page=Number(q.get('page')||1),limit=Number(q.get('limit')||48),category=q.get('category')||'',search=text(q.get('q'));
   const filtered=icons.icons.filter(x=>(!category||x.category===category)&&(!search||text(x.id+' '+x.category+' '+x.file).includes(search)));
   return response({page,limit,total:filtered.length,pages:Math.ceil(filtered.length/limit)||1,rows:filtered.slice((page-1)*limit,page*limit).map(x=>({id:x.id,category:x.category,path:'.'+x.path,width:x.w,height:x.h}))});
  }
  if(url.pathname==='/api/animations/meta')return response({count:animations.clips.length,families:animations.families,source:animations.source,imported:animations.imported});
  if(url.pathname==='/api/animations'){
   const search=text(q.get('q')),fam=q.get('family'),page=Number(q.get('page')||1),limit=Number(q.get('limit')||30);
   const list=animations.clips.filter(x=>(!search||text([x.clip,...x.families,...x.fragments].join(' ')).includes(search))&&(!fam||x.families.includes(fam)));
   return response({total:list.length,pages:Math.ceil(list.length/limit)||1,page,limit,rows:list.slice((page-1)*limit,page*limit),families:animations.families});
  }
  if(url.pathname.startsWith('/api/animations/')){const clip=decodeURIComponent(url.pathname.split('/').pop());const item=animations.clips.find(x=>x.clip===clip);return response(item?{animation:item}:{error:'Не найдено'},!!item);}
  if(url.pathname==='/api/maps/meta')return response({regions:{trosky:{title:'Троски',rows:4,cols:4,tileSize:1024},kuttenberg:{title:'Кутна-Гора',rows:5,cols:6,tileSize:1024}},markers:[],calibrated:false});
  if(url.pathname==='/api/me')return response({admin:false});
  if(url.pathname==='/api/game/meta')return response({meta:catalog.meta});
  if(url.pathname==='/api/game/items'){
   const search=text(q.get('q')),role=q.get('role'),page=Number(q.get('page')||1),limit=Number(q.get('limit')||30);
   let list=catalog.items.filter(item=>(!search||text([item.id,item.name,item.english,item.internal].join(' ')).includes(search))&&
    (!role||role==='all'||role==='result'&&item.recipeOutputs||role==='ingredient'&&item.recipeUses||role==='priced'&&item.referencePrice!=null));
   return response({meta:catalog.meta,page,total:list.length,pages:Math.max(1,Math.ceil(list.length/limit)),limit,rows:list.slice((page-1)*limit,page*limit).map(itemWithIcon)});
  }
  if(url.pathname==='/api/game/recipes'){
   const search=text(q.get('q')),craft=q.get('craft'),kind=q.get('kind'),level=q.get('level'),page=Number(q.get('page')||1),limit=Number(q.get('limit')||30);
   let list=catalog.recipes.filter(r=>(!search||text([r.id,r.name,r.craft,r.craftName,...r.ingredients.map(v=>v.name),...r.outputs.map(v=>v.name)].join(' ')).includes(search))&&
    (!craft||r.craft===craft)&&(!kind||r.kind===kind)&&(!level||String(r.level)===level));
   return response({meta:catalog.meta,page,total:list.length,pages:Math.max(1,Math.ceil(list.length/limit)),limit,rows:list.slice((page-1)*limit,page*limit).map(r=>({id:r.id,name:r.name,kind:r.kind,craft:r.craft,craftName:r.craftName,level:r.level,amount:r.amount,output:r.output,ingredientsCount:r.ingredients.length,outputImageUrl:imageUrl(r.output?.id)}))});
  }
  const item=url.pathname.match(/^\/api\/game\/items\/([a-f0-9-]{36})$/i);
  if(item){const id=item[1].toLowerCase(),found=catalog.items.find(i=>i.id===id);
   if(!found)return response({error:'Предмет не найден'},false);
   const related=catalog.recipes.filter(r=>r.outputs.some(x=>x.id===id)||r.ingredients.some(x=>x.id===id)).slice(0,40);
   return response({item:itemWithIcon(found),meta:catalog.meta,related:related.map(r=>({id:r.id,name:r.name,kind:r.kind,craft:r.craft,craftName:r.craftName,level:r.level,amount:r.amount,ingredientsCount:r.ingredients.length,outputImageUrl:imageUrl(r.output?.id)}))});}
  const recipe=url.pathname.match(/^\/api\/game\/recipes\/([a-zA-Z0-9_-]+)$/);
  if(recipe){const found=catalog.recipes.find(r=>r.id===recipe[1]);return response(found?{recipe:{...found,outputs:found.outputs.map(x=>({...x,imageUrl:imageUrl(x.id)})),ingredients:found.ingredients.map(x=>({...x,imageUrl:imageUrl(x.id)}))},meta:catalog.meta}:{error:'Рецепт не найден'},!!found)}
  return response({error:'В автономной версии этот запрос недоступен'},false);
 };
})();'''
html='''<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KCD2RP Wiki v0.4 · Автономный просмотр</title><style>'''+css+'''</style></head><body><div id="app">Загружаем энциклопедию...</div><script>'''+react+'''</script><script>'''+reactdom+'''</script><script>window.WikiDemoData='''+inline(seed)+''';window.WikiDemoCatalog='''+inline(catalog)+''';window.WikiDemoAnimations='''+inline(animations)+''';window.WikiDemoIcons='''+inline(icons)+''';window.WikiDemoItemIconMatches='''+inline(iconmatches)+''';</script><script>'''+mock+'''</script><script>'''+extra+'''</script><script>'''+iconjs+'''</script><script>'''+source+'''</script></body></html>'''
(root/'public/demo.html').write_text(html,encoding='utf-8')
print('Built offline demo:',round(len(html.encode('utf8'))/1024/1024,2),'MiB')
