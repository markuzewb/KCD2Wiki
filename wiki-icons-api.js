'use strict';
/** Read-only index of KCD2 icon artwork supplied by the project owner. */
const fs=require('node:fs');
const path=require('node:path');
const ROOT=__dirname;
const iconCatalog=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/icons.json'),'utf8'));
const matchCatalog=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/item-icon-map.json'),'utf8'));
const allowedCategories=new Set(Object.keys(iconCatalog.categories));
const items=Object.freeze(iconCatalog.icons.map(icon=>Object.freeze({
  id:icon.id,
  category:icon.category,
  path:icon.path,
  width:icon.w,
  height:icon.h,
  search:(icon.id+' '+icon.category+' '+icon.file).toLocaleLowerCase('ru-RU')
})));
const fileSet=new Set(items.map(i=>i.path));
const idRegex=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function itemInfo(id){
  if(typeof id!=='string'||!idRegex.test(id))return null;
  const row=matchCatalog.items[id.toLowerCase()];
  if(!row||!fileSet.has(row.path))return null;
  return {url:row.path,match:row.match,iconId:row.iconId};
}
function itemImageUrl(id){return itemInfo(id)?.url||null;}
const send=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
const bound=(value,low,high,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.min(high,Math.max(low,Math.floor(n))):fallback};
function handle(req,res,u){
 const pathname=u.pathname;
 if(pathname!=='/api/icons'&&pathname!=='/api/icons/meta')return false;
 if(req.method!=='GET')return send(res,405,{error:'Метод не поддерживается'}),true;
 if(pathname==='/api/icons/meta'){
   return send(res,200,{total:items.length,categories:iconCatalog.categories,matched:matchCatalog.matchedCount,
    itemsInCatalog:matchCatalog.itemCount,matchTypes:matchCatalog.counts,
    source:'Иконки из предоставленного архива icons.rar; совпадения предметов — по внутреннему имени.'}),true;
 }
 const params=u.searchParams;
 const category=String(params.get('category')||'').trim();
 const q=String(params.get('q')||'').trim().slice(0,100).toLocaleLowerCase('ru-RU');
 if(category&&!allowedCategories.has(category))return send(res,400,{error:'Неизвестный раздел иконок'}),true;
 const page=bound(params.get('page'),1,10000,1),limit=bound(params.get('limit'),1,80,48);
 const rows=[];
 for(const icon of items){
   if(category&&icon.category!==category)continue;
   if(q&&!icon.search.includes(q))continue;
   rows.push(icon);
 }
 const total=rows.length;
 return send(res,200,{page,limit,total,pages:Math.max(1,Math.ceil(total/limit)),
   rows:rows.slice((page-1)*limit,page*limit).map(({id,category,path,width,height})=>({id,category,path,width,height}))}),true;
}
module.exports={handle,itemInfo,itemImageUrl};
