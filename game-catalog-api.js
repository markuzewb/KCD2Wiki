'use strict';
/** Read-only item/recipe catalogue for KCD2RP Wiki. No gameplay/database writes. */
const fs=require('node:fs');
const path=require('node:path');
const extras=require('./wiki-extra-api');
const icons=require('./wiki-icons-api');
const ROOT=__dirname;
const BASE=path.join(ROOT,'catalog','game-catalog.json');
const OVERRIDE=path.join(path.resolve(process.env.WIKI_DATA_DIR||path.join(ROOT,'data')),'game-catalog.json');
let loadedPath='',mtime=0,cache=null;
const answer=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
const searchText=s=>String(s||'').trim().toLocaleLowerCase('ru-RU');
const small=(s,n=160)=>String(s??'').trim().slice(0,n);
const range=(v,min,max,fallback)=>{let n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):fallback};
const PRICE=p=>typeof p==='number'&&Number.isFinite(p)?p:null;
function validateCatalog(data){
 if(!data||typeof data!=='object'||!data.meta||!Array.isArray(data.items)||!Array.isArray(data.recipes))throw new Error('Некорректный формат каталога. Нужны meta, items и recipes.');
 if(data.items.length>12000||data.recipes.length>5000)throw new Error('Превышен лимит записей.');
 const ids=new Set(),recipeIds=new Set();
 for(const item of data.items){
   if(!item||typeof item!=='object'||typeof item.id!=='string'||!(/^[a-f0-9-]{36}$/i).test(item.id)||!small(item.name,300)||item.name.length>300)throw new Error('Некорректный предмет');
   if(ids.has(item.id))throw new Error('Повторяющийся GUID предмета');ids.add(item.id);
   if(item.referencePrice!=null&&PRICE(item.referencePrice)===null)throw new Error('Некорректная цена предмета');
 }
 for(const r of data.recipes){
   if(!r||typeof r!=='object'||typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,140}$/.test(r.id)||!r.name||typeof r.name!=='string'||r.name.length>300)throw new Error('Некорректный рецепт');
   if(!['rp','native','catalog-candidate'].includes(r.kind))throw new Error('Неизвестный тип рецепта');
   if(recipeIds.has(r.id))throw new Error('Повторяющийся ID рецепта');recipeIds.add(r.id);
   if(!Array.isArray(r.ingredients)||r.ingredients.length>100||!Array.isArray(r.outputs)||r.outputs.length>30)throw new Error('Некорректные ингредиенты рецепта');
   for(const v of [...r.ingredients,...r.outputs]){
     if(!v||typeof v!=='object'||typeof v.name!=='string'||v.name.length>300||(v.id&&typeof v.id!=='string'))throw new Error('Неправильная ссылка на предмет');
   }
 }
 if(data.meta.itemCount!==data.items.length||data.meta.recipeCount!==data.recipes.length)throw new Error('Количество записей не совпадает с meta');
 return data;
}
function dataFile(){return fs.existsSync(OVERRIDE)?OVERRIDE:BASE;}
function get(){
 const filename=dataFile();const stat=fs.statSync(filename);
 if(!cache||filename!==loadedPath||mtime!==stat.mtimeMs){
  cache=validateCatalog(JSON.parse(fs.readFileSync(filename,'utf8')));
  loadedPath=filename;mtime=stat.mtimeMs;
  const c=cache;
  c._itemById=new Map(c.items.map(x=>[x.id.toLowerCase(),x]));
  c._recipeById=new Map(c.recipes.map(x=>[x.id,x]));
  c._itemsIndex=c.items.map(item=>searchText([item.name,item.english,item.internal,item.id].join(' ')));
  c._recipesIndex=c.recipes.map(r=>searchText([r.id,r.name,r.craft,r.craftName,...r.ingredients.map(g=>g.name),...r.outputs.map(g=>g.name)].join(' ')));
 }
 return cache;
}
function recipeSubOf(d,r){const out=r.output?.id&&d._itemById.get(r.output.id.toLowerCase());return (out&&out.subName)||'Прочее';}
function recipeSubcatsOf(d){
 if(!d._recipeSubcats){
  const subs={};
  for(const r of d.recipes){const s=recipeSubOf(d,r);(subs[r.craft]=subs[r.craft]||{})[s]=(subs[r.craft][s]||0)+1;}
  d._recipeSubcats=Object.fromEntries(Object.entries(subs).map(([craft,m])=>[craft,Object.entries(m).sort((a,b)=>b[1]-a[1])]));
 }
 return d._recipeSubcats;
}
function basicMeta(d){return {...d.meta,recipeSubcats:recipeSubcatsOf(d),sourceHashes:undefined};}
function pageOf(rows,q){const page=range(q.get('page'),1,10000,1),limit=range(q.get('limit'),1,80,24);return {page,limit,total:rows.length,pages:Math.max(1,Math.ceil(rows.length/limit)),rows:rows.slice((page-1)*limit,page*limit)};}
function itemSummary(item){const custom=extras.imageUrl(item.id);return {...item,imageUrl:custom||icons.itemImageUrl(item.id),iconMatch:custom?null:icons.itemInfo(item.id)?.match||null}}
function recipeSummary(r){return {id:r.id,name:r.name,kind:r.kind,craft:r.craft,craftName:r.craftName,level:r.level,amount:r.amount,output:r.output,ingredientsCount:r.ingredients.length,outputImageUrl:r.output?.id?extras.imageListUrl(r.output.id):null};}
async function handle(req,res,u,ctx){
 const pathname=u.pathname;
 if(!pathname.startsWith('/api/game/')&&pathname!=='/api/admin/game-catalog')return false;
 try{
  if(pathname==='/api/admin/game-catalog'){
   if(req.method!=='POST')return answer(res,405,{error:'Метод не поддерживается'}),true;
   if(!ctx.session(req))return answer(res,401,{error:'Требуется вход редактора'}),true;
   if(!ctx.trustedOrigin(req))return answer(res,403,{error:'Недопустимый Origin'}),true;
   const payload=await ctx.body(req,8000000);
   const next=validateCatalog(payload.catalog||payload);
   const folder=path.dirname(OVERRIDE);fs.mkdirSync(folder,{recursive:true});
   if(fs.existsSync(OVERRIDE)){
     const old=path.join(folder,'game-catalog.backup-'+Date.now()+'.json');
     fs.copyFileSync(OVERRIDE,old);
     const snapshots=fs.readdirSync(folder).filter(s=>/^game-catalog\.backup-\d+\.json$/.test(s)).sort();
     for(const extra of snapshots.slice(0,-5))fs.rmSync(path.join(folder,extra));
   }
   const temp=OVERRIDE+'.tmp';fs.writeFileSync(temp,JSON.stringify({meta:next.meta,items:next.items,recipes:next.recipes}));fs.renameSync(temp,OVERRIDE);
   loadedPath='';cache=null;
   return answer(res,200,{ok:true,itemCount:next.items.length,recipeCount:next.recipes.length,sourceArchive:small(next.meta.sourceArchive,120)}),true;
  }
  if(req.method!=='GET')return answer(res,405,{error:'Метод не поддерживается'}),true;
  const d=get();
  if(pathname==='/api/game/meta')return answer(res,200,{meta:basicMeta(d)}),true;
  const itemDetail=pathname.match(/^\/api\/game\/items\/([a-f0-9-]{36})$/i);
  if(itemDetail){
    const item=d._itemById.get(itemDetail[1].toLowerCase());if(!item)return answer(res,404,{error:'Предмет не найден'}),true;
    const related=d.recipes.filter(r=>r.outputs.some(g=>g.id===item.id)||r.ingredients.some(g=>g.id===item.id)).slice(0,40).map(recipeSummary);
    const twins=d.items.filter(row=>row.name===item.name&&row.category===item.category);
    const variants=twins.length>1?twins.map(v=>{
      const recipe=d.recipes.find(r=>r.outputs.some(o=>o.id===v.id));
      return {id:v.id,name:v.name,internal:v.internal,gamePrice:v.gamePrice,referencePrice:v.referencePrice,
        weight:v.weight,damage:v.damage,imageUrl:extras.imageListUrl(v.id),
        craft:recipe?{id:recipe.id,craftName:recipe.craftName,level:recipe.level,ingredients:recipe.ingredients.map(g=>(g.amount>1?g.amount+'× ':'')+g.name).join(' + ')}:null};
    }):[];
    return answer(res,200,{item:itemSummary(item),variants,related,meta:basicMeta(d)}),true;
  }
  const recipeDetail=pathname.match(/^\/api\/game\/recipes\/([a-zA-Z0-9_-]{1,140})$/);
  if(recipeDetail){const recipe=d._recipeById.get(recipeDetail[1]);if(!recipe)return answer(res,404,{error:'Рецепт не найден'}),true;
    const twinRecipes=d.recipes.filter(row=>row.name===recipe.name&&row.craft===recipe.craft);
    const recipeVariants=twinRecipes.length>1?twinRecipes
      .slice().sort((a,b)=>(a.level??Infinity)-(b.level??Infinity))
      .map(v=>({id:v.id,name:v.name,craftName:v.craftName,level:v.level,kind:v.kind,amount:v.amount,
        fee:v.fee,xp:v.xp,seconds:v.seconds,
        outputImageUrl:v.output?.id?extras.imageListUrl(v.output.id):null,
        ingredients:v.ingredients.map(g=>(g.amount>1?g.amount+'× ':'')+g.name).join(' + ')})):[];
    return answer(res,200,{recipe:{...recipe,
      outputs:recipe.outputs.map(x=>({...x,imageUrl:x.id?extras.imageListUrl(x.id):null})),
      ingredients:recipe.ingredients.map(x=>({...x,imageUrl:x.id?extras.imageListUrl(x.id):null}))},variants:recipeVariants,meta:basicMeta(d)}),true;}
  if(pathname==='/api/game/items'){
    const q=searchText(u.searchParams.get('q'));const role=u.searchParams.get('role')||'all';
    const cat=u.searchParams.get('cat')||'';const sort=u.searchParams.get('sort')||'';
    const sub=u.searchParams.get('sub')||'';
    let indices=[];
    for(let i=0;i<d.items.length;i++){
      const item=d.items[i];if(q&&!d._itemsIndex[i].includes(q))continue;
      if(cat&&item.category!==cat)continue;
      if(sub&&(item.subName||'Прочее')!==sub)continue;
      if(role==='result'&&!item.recipeOutputs)continue;
      if(role==='ingredient'&&!item.recipeUses)continue;
      if(role==='priced'&&item.referencePrice==null)continue;
      indices.push(item);
    }
    const price=x=>x.gamePrice??x.referencePrice;
    const cmp={'name-desc':(a,b)=>String(b.name).localeCompare(String(a.name),'ru'),
      'price-desc':(a,b)=>(price(b)??-1)-(price(a)??-1),'price-asc':(a,b)=>(price(a)??Infinity)-(price(b)??Infinity),
      'weight-desc':(a,b)=>(b.weight??-1)-(a.weight??-1),'weight-asc':(a,b)=>(a.weight??Infinity)-(b.weight??Infinity)}[sort];
    if(cmp)indices.sort(cmp);
    const seen=new Map();const grouped=[];
    for(const item of indices){
      const key=item.name+'\u0000'+item.category;
      const p=price(item);
      const g=seen.get(key);
      if(!g){const entry={item,count:1,min:p,max:p};seen.set(key,entry);grouped.push(entry);}
      else{g.count++;if(p!=null){g.min=g.min==null?p:Math.min(g.min,p);g.max=g.max==null?p:Math.max(g.max,p);}}
    }
    const page=pageOf(grouped,u.searchParams);
    return answer(res,200,{...page,rows:page.rows.map(g=>{const row=itemSummary(g.item);delete row.stats;row.variants=g.count;row.priceMin=g.min;row.priceMax=g.max;return row;}),meta:basicMeta(d)}),true;
  }
  if(pathname==='/api/game/recipes'){
    const q=searchText(u.searchParams.get('q'));const craft=u.searchParams.get('craft')||'';
    const kind=u.searchParams.get('kind')||'';const level=u.searchParams.get('level')||'';
    const sub=u.searchParams.get('sub')||'';
    const sort=u.searchParams.get('sort')||'';
    let rows=[];
    for(let i=0;i<d.recipes.length;i++){
      const r=d.recipes[i];if(q&&!d._recipesIndex[i].includes(q))continue;
      if(craft&&r.craft!==craft)continue;
      if(kind&&r.kind!==kind)continue;
      if(level&&String(r.level)!==level)continue;
      if(sub&&recipeSubOf(d,r)!==sub)continue;
      rows.push(r);
    }
    const cmp={'name-desc':(a,b)=>String(b.name).localeCompare(String(a.name),'ru'),
      'level-desc':(a,b)=>(b.level??-1)-(a.level??-1),'level-asc':(a,b)=>(a.level??Infinity)-(b.level??Infinity),
      'ingr-desc':(a,b)=>b.ingredients.length-a.ingredients.length,'ingr-asc':(a,b)=>a.ingredients.length-b.ingredients.length}[sort];
    if(cmp)rows.sort(cmp);
    const seen=new Map();const grouped=[];
    for(const r of rows){
      const key=r.name+'\u0000'+r.craft;
      const g=seen.get(key);
      if(!g){const entry={recipe:r,count:1,min:r.level,max:r.level};seen.set(key,entry);grouped.push(entry);}
      else{g.count++;if(r.level!=null){g.min=g.min==null?r.level:Math.min(g.min,r.level);g.max=g.max==null?r.level:Math.max(g.max,r.level);}}
    }
    const page=pageOf(grouped,u.searchParams);
    return answer(res,200,{...page,rows:page.rows.map(g=>({...recipeSummary(g.recipe),variants:g.count,levelMin:g.min,levelMax:g.max})),meta:basicMeta(d)}),true;
  }
  return answer(res,404,{error:'Каталог не найден'}),true;
 }catch(e){
  console.error('[WIKI CATALOG]',e.message);
  return answer(res,e.message==='Request too large'?413:400,{error:e.message||'Ошибка каталога'}),true;
 }
}
module.exports={handle};
