'use strict';
/** KCD2RP Wiki — dependency-free Node HTTP API and static host. */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {URL}=require('node:url');
const gameCatalog=require('./game-catalog-api');
const extras=require('./wiki-extra-api');
const ROOT=__dirname,DATA=path.resolve(process.env.WIKI_DATA_DIR||path.join(ROOT,'data'));
const PUBLIC=path.join(ROOT,'public');
const PORT=Number(process.env.PORT||3082);const HOST=process.env.HOST||'127.0.0.1';
const USER=process.env.WIKI_ADMIN_USER||'admin', PASSWORD=process.env.WIKI_ADMIN_PASSWORD||'';
const SECRET=process.env.WIKI_SESSION_SECRET||'';
const PRODUCTION=process.env.NODE_ENV==='production';
const WIKI_BASE_PATH=String(process.env.WIKI_BASE_PATH||'').replace(/\/+$/,'');
if(!PASSWORD||PASSWORD.length<12) { console.error('Set WIKI_ADMIN_PASSWORD (12+ characters) before starting.');process.exit(1) }
if(SECRET.length<32) { console.error('Set WIKI_SESSION_SECRET (32+ characters) before starting.');process.exit(1) }
fs.mkdirSync(DATA,{recursive:true});const DB=path.join(DATA,'wiki.json');
let db;
try{db=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e; db=JSON.parse(fs.readFileSync(path.join(ROOT,'seed.json'),'utf8'));writeDB(db)}
function writeDB(next){const temp=DB+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2));fs.renameSync(temp,DB)}
const now=()=>new Date().toISOString();
const safe=(s,n=150)=>String(s??'').trim().slice(0,n);
const slugify=s=>safe(s,120).toLowerCase().replace(/[^a-z0-9а-яё\s-]/gi,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'article';
const json=(res,code,obj,headers={})=>{const body=JSON.stringify(obj);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(body)};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
const b64=b=>Buffer.from(b).toString('base64url');
const mac=x=>b64(crypto.createHmac('sha256',SECRET).update(x).digest());
const loginAttempts=new Map();
function session(req){let token=cookies(req)['kcd2rp_wiki_session'];if(!token)return false;
 let [payload,sig]=token.split('.');if(!payload||!sig)return false;
 const expected=mac(payload);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;
 try{let v=JSON.parse(Buffer.from(payload,'base64url').toString());return v.u===USER&&v.exp>Date.now()}catch{return false}
}
function sessionCookie(value,maxAge=0){return `kcd2rp_wiki_session=${value}; HttpOnly; SameSite=Strict; Path=${WIKI_BASE_PATH?WIKI_BASE_PATH+'/':'/'}; Max-Age=${maxAge}${PRODUCTION?'; Secure':''}`}
function trustedOrigin(req){const origin=req.headers.origin;if(!origin)return true;
 try{let u=new URL(origin);return u.host===req.headers.host&&(u.protocol==='https:'||(!PRODUCTION&&u.protocol==='http:'))}catch{return false}}
const sendError=(res,code,message)=>json(res,code,{error:message});
function body(req,limit=100000){return new Promise((resolve,reject)=>{let parts=[],size=0,failed=false;req.on('data',chunk=>{if(failed)return;size+=chunk.length;if(size>limit){failed=true;reject(new Error('Request too large'));return}parts.push(chunk)});req.on('end',()=>{if(failed)return;try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)})}
function validateArticle(entry,old){if(!entry||typeof entry!=='object')throw new Error('Некорректная статья');
 const title=safe(entry.title,140),description=safe(entry.description,400),category=safe(entry.category,80),type=safe(entry.type,24);
 if(title.length<3)throw new Error('Введите название статьи');
 if(!db.categories.some(c=>c.id===category))throw new Error('Выберите существующую категорию');
 if(!['article','catalog','guide','changelog'].includes(type))throw new Error('Недопустимый тип статьи');
 let slug=slugify(entry.slug||title);
 if(db.articles.some(a=>a.slug===slug&&a.id!==old?.id))throw new Error('Такой адрес статьи уже существует');
 let blocks=Array.isArray(entry.blocks)?entry.blocks:[];
 if(blocks.length>80)throw new Error('Не более 80 блоков');
 blocks=blocks.map(b=>{
   let t=safe(b.type,18);if(!['heading','text','list','notice','table'].includes(t))throw new Error('Неизвестный тип блока');
   if(t==='table'){
     if(!Array.isArray(b.columns)||!Array.isArray(b.rows)||b.columns.length>12||b.rows.length>1000)throw new Error('Некорректная таблица');
     return {type:'table',columns:b.columns.map(x=>safe(x,100)),rows:b.rows.map(r=>(Array.isArray(r)?r:[]).slice(0,b.columns.length).map(x=>safe(x,250)))};
   }
   return {type:t,value:safe(b.value,10000)};
 });
 return {id:old?.id||crypto.randomUUID(),slug,title,description,category,type,icon:safe(entry.icon,3)||'📖',tags:(Array.isArray(entry.tags)?entry.tags:[]).slice(0,12).map(t=>safe(t,40)),blocks,updatedAt:now(),createdAt:old?.createdAt||now(),published:entry.published!==false,featured:!!entry.featured};
}
const handler=async(req,res)=>{
 const u=new URL(req.url,'http://local'),pathname=u.pathname;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 if(pathname.startsWith('/api/')){
  try{
   if(await extras.handle(req,res,u,{session,trustedOrigin,body}))return;
   if(await gameCatalog.handle(req,res,u,{session,trustedOrigin,body}))return;
   if(req.method==='GET'&&pathname==='/api/content')return json(res,200,{site:db.site,categories:db.categories,articles:db.articles.filter(a=>a.published||session(req))});
   if(req.method==='GET'&&pathname==='/api/me')return json(res,200,{admin:session(req)});
   if(req.method==='POST'&&pathname==='/api/login'){
    if(!trustedOrigin(req))return sendError(res,403,'Недопустимое происхождение запроса');
    const ip=req.socket.remoteAddress||'unknown',t=Date.now(),tries=(loginAttempts.get(ip)||[]).filter(v=>t-v<900000);
    if(tries.length>=8)return sendError(res,429,'Слишком много попыток. Повторите позже.');
    const info=await body(req);const usr=safe(info.username,100),password=String(info.password||'');
    const a=crypto.createHash('sha256').update(usr).digest(),b=crypto.createHash('sha256').update(USER).digest();
    const c=crypto.createHash('sha256').update(password).digest(),d=crypto.createHash('sha256').update(PASSWORD).digest();
    if(!crypto.timingSafeEqual(a,b)||!crypto.timingSafeEqual(c,d)){tries.push(t);loginAttempts.set(ip,tries);return sendError(res,401,'Неверные данные для входа')}
    loginAttempts.delete(ip);const payload=b64(JSON.stringify({u:USER,exp:Date.now()+8*3600000}));
    return json(res,200,{admin:true},{'Set-Cookie':sessionCookie(`${payload}.${mac(payload)}`,8*3600)});
   }
   if(req.method==='POST'&&pathname==='/api/logout')return json(res,200,{ok:true},{'Set-Cookie':sessionCookie('',0)});
   if(!session(req))return sendError(res,401,'Требуется вход администратора');
   if(!trustedOrigin(req))return sendError(res,403,'Недопустимое происхождение запроса');
   if(req.method==='POST'&&pathname==='/api/articles'){
    const info=await body(req),a=validateArticle(info);db.articles.unshift(a);writeDB(db);return json(res,201,{article:a});
   }
   const match=pathname.match(/^\/api\/articles\/([a-f0-9-]{36})$/i);
   if(match&&req.method==='PUT'){
     const index=db.articles.findIndex(a=>a.id===match[1]);if(index<0)return sendError(res,404,'Статья не найдена');
     const a=validateArticle(await body(req),db.articles[index]);db.articles[index]=a;writeDB(db);return json(res,200,{article:a});
   }
   if(match&&req.method==='DELETE'){
     const count=db.articles.length;db.articles=db.articles.filter(a=>a.id!==match[1]);if(db.articles.length===count)return sendError(res,404,'Статья не найдена');
     writeDB(db);return json(res,200,{ok:true});
   }
   return sendError(res,404,'API не найден');
  }catch(e){return sendError(res,e.message==='Request too large'?413:400,e.message||'Ошибка запроса')}
 }
 if(extras.tryServeImage(req,res,pathname))return;
 if(req.method!=='GET'&&req.method!=='HEAD')return sendError(res,405,'Недопустимый метод');
 let rel=pathname==='/'?'/index.html':pathname;
 if(!path.extname(rel))rel='/index.html';
 let fp=path.resolve(PUBLIC,'.'+rel);
 if(!fp.startsWith(PUBLIC+path.sep))return sendError(res,403,'Forbidden');
 let ext=path.extname(fp);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2'};
 if(!types[ext])return sendError(res,404,'Not found');
 fs.stat(fp,(err,st)=>{if(err||!st.isFile())return sendError(res,404,'Not found');res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':ext==='.html'?'no-cache':'public,max-age=3600'});if(req.method==='HEAD')return res.end();fs.createReadStream(fp).pipe(res)});
};
http.createServer(handler).listen(PORT,HOST,()=>console.log(`KCD2RP Wiki listening on http://${HOST}:${PORT}`));
