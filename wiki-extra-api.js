'use strict';
/** Additional read-only game animations, offline atlas maps and opt-in editorial media. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const icons=require('./wiki-icons-api');
const ROOT=__dirname;
const DATA=path.resolve(process.env.WIKI_DATA_DIR||path.join(ROOT,'data'));
const IMAGES=path.join(DATA,'media','items');
const MAPS_DEFAULT=path.join(ROOT,'catalog','map-markers.json');
const MAPS_OVERRIDE=path.join(DATA,'map-markers.json');
const animData=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog','animations.json'),'utf8'));
const animations=animData.clips.map(x=>({clip:String(x.clip),families:x.families||[],fragments:x.fragments||[],ru:x.ru||'',desc:x.desc||'',phase:x.phase||'',cat:x.cat||'',catIcon:x.catIcon||'',sub:x.sub||'',pose:x.pose||'',kind:x.kind||'',tags:x.tags||[]}));
const animIndex=animations.map(x=>[x.clip,x.ru,x.desc,...x.tags,...x.families,...x.fragments].join(' ').toLocaleLowerCase('ru-RU'));
const byClip=new Map(animations.map(x=>[x.clip,x]));
const familyCounts={};for(const a of animations)for(const f of a.families)familyCounts[f]=(familyCounts[f]||0)+1;
const animCatCounts={};for(const a of animations)if(a.cat)animCatCounts[a.cat]=(animCatCounts[a.cat]||0)+1;
const animKindCounts={};for(const a of animations)if(a.kind)animKindCounts[a.kind]=(animKindCounts[a.kind]||0)+1;
const animPhaseCounts={};for(const a of animations)if(a.phase)animPhaseCounts[a.phase]=(animPhaseCounts[a.phase]||0)+1;
const animPoseCounts={};for(const a of animations)if(a.pose)animPoseCounts[a.pose]=(animPoseCounts[a.pose]||0)+1;
const animCatalog=animData.catalog||[];
const MAP_LABELS=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog','map-labels.json'),'utf8')).labels||{};
const REGION_INFO={
 trosky:{title:'Троски',rows:4,cols:4,tileSize:1024,source:'Карты игрового режима KCD2RP',labels:MAP_LABELS.trosky||[]},
 kuttenberg:{title:'Кутна-Гора',rows:5,cols:6,tileSize:1024,source:'Карты игрового режима KCD2RP',labels:MAP_LABELS.kuttenberg||[]}
};
const J=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
const limit=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback};
const str=(v,max)=>String(v??'').trim().slice(0,max);
const guid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
function mapFile(){return fs.existsSync(MAPS_OVERRIDE)?MAPS_OVERRIDE:MAPS_DEFAULT;}
function readMarkers(){
 const payload=JSON.parse(fs.readFileSync(mapFile(),'utf8'));
 if(payload.schema!==1||!Array.isArray(payload.markers)||payload.markers.length>3000)throw Error('Некорректная база меток');
 return payload.markers;
}
function saveMarkers(markers){
 fs.mkdirSync(DATA,{recursive:true});
 if(fs.existsSync(MAPS_OVERRIDE)){
  const stamp=Date.now();fs.copyFileSync(MAPS_OVERRIDE,path.join(DATA,'map-markers.backup-'+stamp+'.json'));
  const saved=fs.readdirSync(DATA).filter(v=>/^map-markers\.backup-\d+\.json$/.test(v)).sort();
  for(const x of saved.slice(0,-5))fs.rmSync(path.join(DATA,x));
 }
 const temp=MAPS_OVERRIDE+'.tmp';fs.writeFileSync(temp,JSON.stringify({schema:1,markers},null,2));fs.renameSync(temp,MAPS_OVERRIDE);
}
function validateMarker(data){
 if(!data||!REGION_INFO[data.region])throw Error('Выберите игровой регион');
 const name=str(data.name,80),category=str(data.category,25);
 const x=Number(data.x),y=Number(data.y);
 if(name.length<2||String(data.name||'').length>80)throw Error('Название метки: от 2 до 80 символов');
 if(!['settlement','landmark','transport','other'].includes(category))throw Error('Недопустимая категория метки');
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)throw Error('Координаты метки должны находиться в пределах карты');
 return {id:crypto.randomUUID(),region:data.region,name,category,x:Number(x.toFixed(6)),y:Number(y.toFixed(6)),createdAt:new Date().toISOString()};
}
function fileFor(id){
 if(!guid.test(id))return null;
 for(const ext of ['webp','png','jpg']){
  const name=path.join(IMAGES,id.toLowerCase()+'.'+ext);
  if(fs.existsSync(name))return {path:name,ext};
 }
 return null;
}
function imageUrl(id){const info=fileFor(id);return info?'/media/items/'+id.toLowerCase()+'.'+info.ext:null;}
function imageListUrl(id){return imageUrl(id)||icons.itemImageUrl(id);}
function validImage(bytes){
 if(bytes.length<40||bytes.length>2097152)throw Error('Изображение должно быть от 40 байт до 2 МБ');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
  const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  if(!w||!h||w>4096||h>4096||w*h>10000000)throw Error('Недопустимые размеры PNG');
  return 'png';
 }
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'webp';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff&&bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9)return 'jpg';
 throw Error('Допустимы только настоящие PNG, JPEG и WebP (SVG запрещён)');
}
function tryServeImage(req,res,p){
 const match=p.match(/^\/media\/items\/([a-f0-9-]{36})\.(png|webp|jpg)$/i);
 if(!match)return false;
 const exists=fileFor(match[1]);if(!exists||path.extname(exists.path)!=='.'+match[2]){J(res,404,{error:'Изображение не найдено'});return true;}
 if(req.method!=='GET'&&req.method!=='HEAD'){J(res,405,{error:'Метод не поддерживается'});return true;}
 res.writeHead(200,{'Content-Type':{png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[exists.ext],'Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD')res.end();else fs.createReadStream(exists.path).pipe(res);
 return true;
}
async function handle(req,res,u,ctx){
 const p=u.pathname;
 if(!p.startsWith('/api/animations')&&!p.startsWith('/api/maps/')&&!p.startsWith('/api/admin/item-image/')&&!p.startsWith('/api/icons'))return false;
 try{
  if(icons.handle(req,res,u))return true;
  if(p.startsWith('/api/animations')){
   if(req.method!=='GET')return J(res,405,{error:'Метод не поддерживается'}),true;
   if(p==='/api/animations/meta')return J(res,200,{count:animations.length,families:familyCounts,cats:animCatCounts,catalog:animCatalog,kinds:animKindCounts,phases:animPhaseCounts,poses:animPoseCounts,source:animData.source,imported:animData.imported}),true;
   const detail=p.match(/^\/api\/animations\/([a-zA-Z0-9_.-]{1,90})$/);
   if(detail){const row=byClip.get(detail[1]);return J(res,row?200:404,row?{animation:row}:{error:'Анимация не найдена'}),true;}
   if(p==='/api/animations'){
    const q=str(u.searchParams.get('q'),90).toLocaleLowerCase('ru-RU'),family=str(u.searchParams.get('family'),50),cat=str(u.searchParams.get('cat'),60);
    const sub=str(u.searchParams.get('sub'),80),kind=str(u.searchParams.get('kind'),20),phase=str(u.searchParams.get('phase'),40),pose=str(u.searchParams.get('pose'),20);
    const page=limit(u.searchParams.get('page'),1,10000,1),per=limit(u.searchParams.get('limit'),1,80,30);
    const indices=[];
    for(let i=0;i<animations.length;i++){
     const a=animations[i];
     if(q&&!animIndex[i].includes(q))continue;
     if(family&&!a.families.includes(family))continue;
     if(cat&&a.cat!==cat)continue;
     if(sub&&a.sub!==sub)continue;
     if(kind&&a.kind!==kind)continue;
     if(phase&&a.phase!==phase)continue;
     if(pose&&a.pose!==pose)continue;
     indices.push(i);
    }
    return J(res,200,{total:indices.length,pages:Math.max(1,Math.ceil(indices.length/per)),page,limit:per,
      rows:indices.slice((page-1)*per,page*per).map(i=>animations[i]),families:familyCounts,cats:animCatCounts}),true;
   }
   return J(res,404,{error:'Неизвестный запрос'}),true;
  }
  if(p==='/api/maps/meta'&&req.method==='GET')return J(res,200,{regions:REGION_INFO,markers:readMarkers(),calibrated:false,notice:'Игровые X/Y не привязаны к пикселям; метки размещаются вручную редактором.'}),true;
  if(p==='/api/maps/markers'&&req.method==='POST'){
   if(!ctx.session(req))return J(res,401,{error:'Требуется вход редактора'}),true;
   if(!ctx.trustedOrigin(req))return J(res,403,{error:'Недопустимый Origin'}),true;
   const row=validateMarker(await ctx.body(req,4000)),list=readMarkers();
   if(list.length>=3000)throw Error('Лимит меток превышен');
   list.push(row);saveMarkers(list);return J(res,201,{marker:row}),true;
  }
  const del=p.match(/^\/api\/maps\/markers\/([a-f0-9-]{36})$/i);
  if(del&&req.method==='DELETE'){
   if(!ctx.session(req))return J(res,401,{error:'Требуется вход редактора'}),true;
   if(!ctx.trustedOrigin(req))return J(res,403,{error:'Недопустимый Origin'}),true;
   const rows=readMarkers(),next=rows.filter(x=>x.id!==del[1]);
   if(next.length===rows.length)return J(res,404,{error:'Метка не найдена'}),true;
   saveMarkers(next);return J(res,200,{ok:true}),true;
  }
  const image=p.match(/^\/api\/admin\/item-image\/([a-f0-9-]{36})$/i);
  if(image&&req.method==='POST'){
   if(!ctx.session(req))return J(res,401,{error:'Требуется вход редактора'}),true;
   if(!ctx.trustedOrigin(req))return J(res,403,{error:'Недопустимый Origin'}),true;
   const data=await ctx.body(req,3100000);
   if(!data||typeof data.data!=='string'||data.data.length>2900000||!(/^[a-zA-Z0-9+/]+={0,2}$/).test(data.data))throw Error('Некорректное содержимое изображения');
   const bytes=Buffer.from(data.data,'base64'),ext=validImage(bytes),id=image[1].toLowerCase();
   fs.mkdirSync(IMAGES,{recursive:true});
   for(const old of ['png','jpg','webp']){const f=path.join(IMAGES,id+'.'+old);if(fs.existsSync(f))fs.rmSync(f);}
   const file=path.join(IMAGES,id+'.'+ext),tmp=file+'.tmp';fs.writeFileSync(tmp,bytes,{flag:'wx'});fs.renameSync(tmp,file);
   return J(res,200,{ok:true,url:'/media/items/'+id+'.'+ext+'?v='+Date.now()}),true;
  }
  return J(res,404,{error:'Неизвестный запрос'}),true;
 }catch(e){console.error('[WIKI EXTRA]',e.message);return J(res,e.message==='Request too large'?413:400,{error:e.message||'Ошибка запроса'}),true;}
}
module.exports={handle,tryServeImage,imageUrl,imageListUrl};
