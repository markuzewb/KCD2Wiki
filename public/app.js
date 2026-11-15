/* KCD2RP Wiki React edition. Self-hosted MIT-licensed React 16 runtime. */
(function(){'use strict';
const WIKI_BASE=String(window.KCD2RP_WIKI_BASE||'').replace(/\/+$/,'');
const wikiUrl=u=>typeof u==='string'&&u.startsWith('/')&&!u.startsWith('//')?WIKI_BASE+u:u;
const wikiFetch=(u,options)=>window.KCD2RPStaticAPI?window.KCD2RPStaticAPI.fetch(u,options):fetch(wikiUrl(u),options);
const h=React.createElement;
const ICON_PATHS={
 home:['M3 10.5 12 3l9 7.5','M5.5 9.5V21h13V9.5','M9 21v-6h6v6'],
 book:['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z'],
 grid:['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
 list:['M8 6h13','M8 12h13','M8 18h13','M3.5 6h.01','M3.5 12h.01','M3.5 18h.01'],
 package:['M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z','M3.3 7 12 12l8.7-5','M12 22V12'],
 hammer:['m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9','m17 5 2 2','M9 8 5 4l2-2 4 4','m13 9 2-2','m16 12 6-6-4-4-6 6'],
 clock:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M12 6v6l4 2'],
 map:['m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z','M9 3v15','M15 6v15'],
 pin:['M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0','M12 10h.01'],
 users:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
 shield:['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
 wrench:['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0L21 6a6 6 0 0 1-8 8l-7.6 7.6a2 2 0 0 1-3-3L10 11a6 6 0 0 1 8-8z'],
 search:['m21 21-4.35-4.35','M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
 arrow:['M5 12h14','m12 5 7 7-7 7'],
 globe:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','M2 12h20','M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10'],
 settings:['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.3 2.3-.06-.06A1.65 1.65 0 0 0 15.6 19.4a1.65 1.65 0 0 0-1.2 1.6V21h-3v-.09a1.65 1.65 0 0 0-1.2-1.6 1.65 1.65 0 0 0-1.82.33l-.06.06-2.3-2.3.06-.06A1.65 1.65 0 0 0 6.4 15.6a1.65 1.65 0 0 0-1.6-1.2H4v-3h.8A1.65 1.65 0 0 0 6.4 10.2a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.3-2.3.06.06A1.65 1.65 0 0 0 10.2 6.4a1.65 1.65 0 0 0 1.2-1.6V4h3v.8A1.65 1.65 0 0 0 15.6 6.4a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.3 2.3-.06.06A1.65 1.65 0 0 0 19.4 10.2a1.65 1.65 0 0 0 1.6 1.2h.1v3h-.1a1.65 1.65 0 0 0-1.6 1.2Z'],
 menu:['M4 7h16','M4 12h16','M4 17h16'],
 sun:['M12 3v2','M12 19v2','M3 12h2','M19 12h2','m5.6 5.6 1.5 1.5','m16.9 16.9 1.5 1.5','m5.6 18.4 1.5-1.5','m16.9 7.1 1.5-1.5','M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
 moon:['M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z'],
 image:['M3 3h18v18H3z','M7 14l3-3 4 4 3-3 4 4','M8 8h.01'],
 compass:['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20','m16 8-2 6-6 2 2-6z'],
 edit:['M12 20h9','M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'],
 star:['m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.2 21l1.1-6.4L2.5 9 9 8Z'],
 horse:['M5 21v-6l-2-4 3-5 3 1 5-4 6 3v7l-3 2-2 6','M8 15h9','M15 8h.01'],
 server:['M4 3h16v7H4z','M4 14h16v7H4z','M8 7h.01','M8 18h.01'],
 link:['M10 13a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1L11 5','M14 11a5 5 0 0 0-7.1 0l-2.4 2.4a5 5 0 0 0 7.1 7.1L13 19'],
 file:['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z','M14 2v6h6','M8 13h8','M8 17h8']
};
function Icon({name}){const paths=ICON_PATHS[name]||ICON_PATHS.file;return h('svg',{className:'icon-svg',viewBox:'0 0 24 24',width:19,height:19,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'},paths.map((d,i)=>h('path',{key:i,d})));}
function sectionIcon(id,title){const t=(id+' '+title).toLowerCase();if(/правил|закон|безопас/.test(t))return 'shield';if(/ремес|кузн|craft|алхим|recipe/.test(t))return 'hammer';if(/работ|jobs/.test(t))return 'wrench';if(/фрак|guild|faction/.test(t))return 'users';if(/лошад|конюш|транспорт|horse|cart/.test(t))return 'horse';if(/карт|world|мир|географ/.test(t))return 'map';if(/предмет|item|инвентар/.test(t))return 'package';return 'book';}
const categories=[];
const pad=n=>String(n).padStart(2,'0');
function cls(...v){return v.filter(Boolean).join(' ')}
function currentPath(){if(window.KCD2RP_STATIC||!['http:','https:'].includes(location.protocol))return location.hash.slice(1)||'/';const p=location.pathname;return WIKI_BASE&&(p===WIKI_BASE||p.startsWith(WIKI_BASE+'/'))?(p.slice(WIKI_BASE.length)||'/'):p}
function navigate(to){if(window.KCD2RP_STATIC||!['http:','https:'].includes(location.protocol))location.hash=to;else history.pushState({},'',wikiUrl(to));dispatchEvent(new PopStateEvent('popstate'))}
window.KCD2RPNavigate=navigate;
function Link(props){const p=Object.assign({},props);const target=p.to;delete p.to;delete p.children;p.href=window.KCD2RP_STATIC?wikiUrl('/#'+target):wikiUrl(target);p.onClick=function(e){if(props.onClick)props.onClick(e);if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();navigate(target)};return h('a',p,props.children)}
function Block({block}){
 if(block.type==='heading')return h('h2',{className:'article-heading'},block.value);
 if(block.type==='notice')return h('aside',{className:'article-notice'},h('span',{},'✧'),h('p',{},block.value));
 if(block.type==='text')return h('p',{className:'article-copy'},block.value);
 if(block.type==='list')return h('ul',{className:'article-list'},block.value.split('\n').filter(Boolean).map((v,i)=>h('li',{key:i},v)));
 if(block.type==='table'){const head=h('thead',{},h('tr',{},(block.columns||[]).map((x,i)=>h('th',{key:i},x))));const rows=h('tbody',{},(block.rows||[]).map((row,i)=>h('tr',{key:i},row.map((cell,j)=>h('td',{key:j},cell)))));return h('div',{className:'table-scroll'},h('table',{className:'data-table'},head,rows));}
 if(block.type==='image')return h('figure',{className:'article-image'},h('img',{src:wikiUrl(block.value),alt:block.alt||'',loading:'lazy'}));
 if(block.type==='gallery')return h('div',{className:'article-gallery'},(block.items||[]).map((it,i)=>h(Link,{key:i,to:it.to||'/',className:'article-gallery-card'},h('img',{src:wikiUrl(it.image),alt:it.title||'',loading:'lazy'}),(it.title||it.subtitle)?h('div',{className:'article-gallery-meta'},it.title&&h('strong',{},it.title),it.subtitle&&h('span',{},it.subtitle)):null)));
 return null;
}
function countFor(data,category){return data.articles.filter(x=>x.category===category).length}
function FilterToggle({value,items,onChange}){return h('div',{className:'chip-row'},items.map(x=>h('button',{type:'button',key:x.value,className:cls('chip',value===x.value&&'active'),onClick:()=>onChange(x.value)},x.label)))}
function ArticleCard({a,categories,compact}){const cat=categories.find(c=>c.id===a.category);return h(Link,{to:'/article/'+a.slug,className:cls('article-card',compact&&'compact')},
 h('div',{className:'card-top'},h('span',{className:'article-icon'},h(Icon,{name:sectionIcon(a.category,cat?.title||'')})),h('span',{className:'card-arr'},'↗')),
 h('div',{className:'card-bottom'},h('span',{className:'overline'},cat?.title||'Энциклопедия'),h('h3',{},a.title),h('p',{},a.description)));
}
function SearchInput({value,onChange,placeholder}){return h('div',{className:'search-field'},h(Icon,{name:'search'}),h('input',{value,onChange:e=>onChange(e.target.value),placeholder:placeholder||'Поиск по энциклопедии...',spellCheck:false,'aria-label':'Поиск'}),value&&h('button',{type:'button',onClick:()=>onChange(''),'aria-label':'Очистить поиск'},'×'))}
const kindLabels={rp:'RP-рецепт','catalog-candidate':'Дополнительный · требует проверки',native:'Нативный KCD2'};
const fmtCount=n=>Number(n||0).toLocaleString('ru-RU');
const fmtPrice=n=>n==null?'—':Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' гр.';
const fmtWeight=n=>n==null?null:Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' кг';
function WikiItemLink({item}){
 if(!item)return h('span',{},'—');
 if(item.exists&&item.id)return h(Link,{to:'/game/item/'+item.id},item.name);
 return h('span',{},item.name||'Без названия');
}
function WikiCatalogPager({page,total,pages,onChange}){
 return h('div',{className:'game-pagination'},
   h('button',{type:'button',disabled:page<=1,onClick:()=>onChange(Math.max(1,page-1))},'← Назад'),
   h('span',{},'Страница ',h('strong',{},page),' из ',fmtCount(pages),' · ',fmtCount(total),' записей'),
   h('button',{type:'button',disabled:page>=pages,onClick:()=>onChange(Math.min(pages,page+1))},'Далее →'));
}
class GameCatalogPage extends React.Component{
 constructor(props){super(props);this.state={q:'',role:'all',cat:'',sub:'',sort:'',kind:'',craft:'',level:'',page:1,rows:[],total:0,pages:1,meta:null,item:null,related:[],variants:[],recipe:null,loading:true,error:'',copied:''};this._seq=0;this._timer=null;this._copyTimer=null;}
 componentDidMount(){this.load();}
 componentDidUpdate(prev){if(prev.mode!==this.props.mode||prev.id!==this.props.id){this.setState({q:'',role:'all',cat:'',sub:'',sort:'',kind:'',craft:'',level:'',page:1,rows:[],item:null,recipe:null},()=>this.load());}}
 componentWillUnmount(){clearTimeout(this._timer);clearTimeout(this._copyTimer);this._seq++;}
 filter(name,value){this.setState({[name]:value,page:1},()=>{clearTimeout(this._timer);this._timer=setTimeout(()=>this.load(),220);});}
 page(n){this.setState({page:n},()=>this.load());}
 async load(){const seq=++this._seq;const st=this.state;const mode=this.props.mode;let url;
  if(mode==='item')url='/api/game/items/'+encodeURIComponent(this.props.id);
  else if(mode==='recipe')url='/api/game/recipes/'+encodeURIComponent(this.props.id);
  else{const q=new URLSearchParams({q:st.q,page:String(st.page),limit:'30'});
   if(mode==='items'&&st.role!=='all')q.set('role',st.role);
   if(mode==='items'&&st.cat)q.set('cat',st.cat);
   if(mode==='items'&&st.cat&&st.sub)q.set('sub',st.sub);
   if(mode==='items'&&st.sort)q.set('sort',st.sort);
   if(mode==='recipes')for(const k of ['kind','craft','level','sort'])if(st[k])q.set(k,st[k]);
   url='/api/game/'+mode+'?'+q.toString();}
  this.setState({loading:true,error:''});
  try{const res=await wikiFetch(url);const body=await res.json();if(!res.ok)throw Error(body.error||'Не удалось открыть каталог');if(this._seq!==seq)return;
   this.setState({loading:false,rows:body.rows||[],item:body.item||null,related:body.related||[],variants:body.variants||[],recipe:body.recipe||null,
      total:body.total||0,pages:body.pages||1,meta:body.meta||this.state.meta,error:''});
  }catch(e){if(this._seq!==seq)return;this.setState({loading:false,error:e.message});}
 }
 intro(title,desc,label){return h('div',{className:'game-title'},h('span',{className:'page-overline'},label||'БАЗА ДАННЫХ KCD2RP'),
   h('h1',{},title),h('p',{},desc));}
 loading(){return h('div',{className:'game-placeholder'},'Загрузка данных из игрового каталога…');}
 failed(){return h('div',{className:'game-placeholder error'},this.state.error,h('button',{onClick:()=>this.load()},'Повторить'));}
 catalog(){
  const isItem=this.props.mode==='items',st=this.state;
  const tabs=h('div',{className:'ref-catalog-tabs'},h(Link,{to:'/game/items',className:cls('ref-tab',isItem&&'active')},'Предметы'),h(Link,{to:'/game/recipes',className:cls('ref-tab',!isItem&&'active')},'Рецепты'),h(Link,{to:'/animations',className:'ref-tab'},'Анимации'),h(Link,{to:'/icons',className:'ref-tab'},'Иконки'));
  const chip=(active,onClick,label,key)=>h('button',{key,className:'extra-chip'+(active?' active':''),onClick},label);
  const subcats=isItem&&st.cat?(st.meta?.itemSubcats?.[st.cat]||[]):[];
  const catRow=st.meta?.itemCategories?.find(c=>c[0]===st.cat);
  const itemChips=isItem&&h('div',{className:'extra-chips ref-item-chips'},
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Категория'),
      (st.meta?.itemCategories||[]).map(c=>chip(st.cat===c[0],()=>this.setState({cat:st.cat===c[0]?'':c[0],sub:'',page:1},()=>this.load()),(c[3]?c[3]+' ':'')+c[1]+' · '+fmtCount(c[2]),c[0]))),
    subcats.length>1?h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Подкатегория'),
      chip(!st.sub,()=>this.filter('sub',''),'Все · '+fmtCount(catRow?catRow[2]:0),'all-subs'),
      subcats.map(s=>chip(st.sub===s[0],()=>this.filter('sub',st.sub===s[0]?'':s[0]),s[0]+' · '+fmtCount(s[1]),s[0]))):null,
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Фильтр'),
      [['result','Результаты изготовления'],['ingredient','Ингредиенты'],['priced','Со справочной ценой']].map(v=>chip(st.role===v[0],()=>this.filter('role',st.role===v[0]?'all':v[0]),v[1],v[0]))),
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Порядок'),
      [['','Название А–Я'],['name-desc','Название Я–А'],['price-desc','Цена: дорогие'],['price-asc','Цена: дешёвые'],['weight-desc','Вес: тяжёлые'],['weight-asc','Вес: лёгкие']].map(v=>chip((st.sort||'')===v[0],()=>this.filter('sort',v[0]),v[1],v[0]||'default'))),
    (st.cat||st.sub||st.role!=='all'||st.sort||st.q)&&h('button',{className:'extra-chip extra-chip-reset',onClick:()=>this.setState({q:'',cat:'',sub:'',role:'all',sort:'',page:1},()=>this.load())},'✕ Сбросить всё'));
  const crafts=st.meta?.recipeCrafts||Object.entries(st.meta?.craftNames||{}).map(([k,v])=>[k,v,0,'🛠️']);
  const recipeChips=!isItem&&h('div',{className:'extra-chips ref-item-chips'},
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Ремесло'),
      crafts.map(c=>chip(st.craft===c[0],()=>this.filter('craft',st.craft===c[0]?'':c[0]),(c[3]?c[3]+' ':'')+c[1]+(c[2]?' · '+fmtCount(c[2]):''),c[0]))),
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Уровень'),
      Array.from({length:10},(_,i)=>String(i+1)).map(v=>chip(st.level===v,()=>this.filter('level',st.level===v?'':v),v,'lvl'+v))),
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Тип'),
      Object.entries(kindLabels).map(([k,v])=>chip(st.kind===k,()=>this.filter('kind',st.kind===k?'':k),v,k))),
    h('div',{className:'extra-chip-group'},h('span',{className:'extra-chip-label'},'Порядок'),
      [['','Название А–Я'],['name-desc','Название Я–А'],['level-asc','Уровень: низкие'],['level-desc','Уровень: высокие'],['ingr-asc','Ингредиенты: меньше'],['ingr-desc','Ингредиенты: больше']].map(v=>chip((st.sort||'')===v[0],()=>this.filter('sort',v[0]),v[1],v[0]||'default'))),
    (st.craft||st.level||st.kind||st.sort||st.q)&&h('button',{className:'extra-chip extra-chip-reset',onClick:()=>this.setState({q:'',craft:'',level:'',kind:'',sort:'',page:1},()=>this.load())},'✕ Сбросить всё'));
  const filters=h('div',{className:'ref-catalog-filters'},h(SearchInput,{value:st.q,onChange:v=>this.filter('q',v),placeholder:isItem?'Поиск предметов...':'Поиск рецептов...'}));
  const cardGrid=st.rows.length?h('div',{className:'game-results ref-card-gallery'},st.rows.map(r=>isItem?this.itemRow(r):this.recipeRow(r))):h('div',{className:'game-placeholder'},'Ничего не найдено. Измените условия поиска.');
  const results=st.error?this.failed():st.loading&&!st.rows.length?this.loading():h('div',{className:'ref-catalog-results'},cardGrid,h(WikiCatalogPager,{page:st.page,total:st.total,pages:st.pages,onChange:n=>this.page(n)}));
  return h('div',{className:'page game-page ref-catalog-page'},
    this.intro(isItem?'Каталог предметов':'Каталог рецептов',isItem?'Предметы KCD2RP — изображения, названия и игровые идентификаторы.':'Рецепты игрового мира: предметы, необходимые материалы и навыки.',''),
    h('div',{className:'ref-catalog-toolbar'},tabs,filters),
    itemChips||recipeChips,
    h('div',{className:'ref-catalog-count'},'Найдено: ',fmtCount(st.total),' · ',isItem?'Предметы':'Рецепты'),
    results);
 }
 copy(text,marker){if(!text)return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).catch(()=>{});else{const el=document.createElement('textarea');el.value=text;document.body.append(el);el.select();document.execCommand('copy');el.remove();}
  if(marker){clearTimeout(this._copyTimer);this.setState({copied:marker});this._copyTimer=setTimeout(()=>this.setState({copied:''}),1300);}}
 itemRow(item){
  const many=(item.variants||1)>1;
  const price=item.gamePrice??item.referencePrice;
  const priceText=many&&item.priceMin!=null&&item.priceMax!=null&&item.priceMin!==item.priceMax
    ?fmtCount(item.priceMin)+'–'+fmtCount(item.priceMax)+' гр.'
    :(price!=null?fmtPrice(price):(many&&item.priceMin!=null?fmtPrice(item.priceMin):null));
  const metaLine=[priceText,fmtWeight(item.weight),item.damage?'⚔ '+fmtCount(item.damage):null].filter(Boolean).join(' · ');
  const cls=item.internal||item.english||'';
  return h(Link,{key:item.id,to:'/game/item/'+item.id,className:'game-result ref-item-card'},
   h('div',{className:'ref-item-art'},
     h('span',{className:'ref-item-id'},item.id&&item.id.length>13?item.id.slice(0,8):item.id),
     cls?h('button',{className:'ref-item-copy',title:'Скопировать класснейм: '+cls,'aria-label':'Скопировать класснейм',onClick:e=>{e.preventDefault();e.stopPropagation();this.copy(cls,item.id);}},this.state.copied===item.id?'✓':'⧉'):null,
     many?h('span',{className:'ref-item-variants',title:'Вариантов предмета: '+item.variants},'× '+fmtCount(item.variants)):null,
     h('img',{src:wikiUrl(item.imageUrl||'/icons/game/_placeholder.webp'),alt:'',loading:'lazy'})),
   h('div',{className:'ref-item-details'},h('strong',{},item.name),h('span',{},metaLine||item.english||item.internal||'Предмет KCD2')))}
 recipeRow(r){
  const many=(r.variants||1)>1;
  const lvl=many&&r.levelMin!=null&&r.levelMax!=null&&r.levelMin!==r.levelMax?'Ур. '+r.levelMin+'–'+r.levelMax:'Ур. '+(r.level??'—');
  return h(Link,{key:r.id,to:'/game/recipe/'+r.id,className:'game-result ref-item-card'},h('div',{className:'ref-item-art'},h('span',{className:'ref-item-id'},lvl),
   many?h('span',{className:'ref-item-variants',title:'Вариантов рецепта: '+r.variants},'× '+fmtCount(r.variants)):null,
   r.outputImageUrl?h('img',{src:wikiUrl(r.outputImageUrl),alt:'',loading:'lazy'}):h('span',{className:'ref-art-placeholder'},h(Icon,{name:'hammer'}))),h('div',{className:'ref-item-details'},h('strong',{},r.name),h('span',{},r.craftName||'Рецепт KCD2')))}
 field(name,val){return h('div',{className:'game-field'},h('small',{},name),h('strong',{},val==null?'—':val));}
 recipeVariants(r){
  const list=this.state.variants;if(!Array.isArray(list)||list.length<2)return null;
  return h('section',{className:'game-detail-block game-item-variants'},
    h('h2',{},'\u0412\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u0440\u0435\u0446\u0435\u043f\u0442\u0430 \u00b7 '+fmtCount(list.length)),
    h('p',{className:'game-variants-hint'},'\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u0438\u043a\u043e\u043d\u043a\u0443 \u2014 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0441\u0440\u0430\u0437\u0443. \u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043e\u0442\u043c\u0435\u0447\u0435\u043d \u0440\u0430\u043c\u043a\u043e\u0439.'),
    h('div',{className:'game-variant-squares'},list.map(v=>h(Link,{
      key:v.id,to:'/game/recipe/'+v.id,
      className:'game-variant-square'+(v.id===r.id?' selected current':''),
      title:'\u0423\u0440\u043e\u0432\u0435\u043d\u044c '+(v.level??'\u2014')+' \u00b7 '+(v.ingredients||'')},
      v.outputImageUrl?h('img',{src:wikiUrl(v.outputImageUrl),alt:'',loading:'lazy'}):h('span',{},'\u25c8'),
      h('em',{className:'game-variant-num'},'\u0443\u0440.'+(v.level??'\u2014'))))));}
 itemVariants(item){
  const list=this.state.variants;if(!Array.isArray(list)||list.length<2)return null;
  return h('section',{className:'game-detail-block game-item-variants'},
    h('h2',{},'\u0412\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0430 \u00b7 '+fmtCount(list.length)),
    h('p',{className:'game-variants-hint'},'\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u0438\u043a\u043e\u043d\u043a\u0443 \u2014 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u0430 \u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f \u0441\u0440\u0430\u0437\u0443. \u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043e\u0442\u043c\u0435\u0447\u0435\u043d \u0440\u0430\u043c\u043a\u043e\u0439.'),
    h('div',{className:'game-variant-squares'},list.map((v,i)=>h(Link,{
      key:v.id,to:'/game/item/'+v.id,
      className:'game-variant-square'+(v.id===item.id?' selected current':''),
      title:(v.internal||v.id)+' \u00b7 '+fmtPrice(v.gamePrice??v.referencePrice)+(v.craft?' \u00b7 '+v.craft.ingredients:'')},
      v.imageUrl?h('img',{src:wikiUrl(v.imageUrl),alt:'',loading:'lazy'}):h('span',{},'\u25c8'),
      h('em',{className:'game-variant-num'},i+1)))));}
 itemStats(item){const stats=item&&item.stats;if(!Array.isArray(stats)||!stats.length)return null;
  const groups=new Map();for(const row of stats){const g=row[3]||'общее';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(row);}
  return h('section',{className:'game-detail-block game-item-stats'},h('h2',{},'Игровые характеристики'),
    [...groups.entries()].map(([g,rows])=>h('div',{key:g,className:'game-stats-group'},h('h3',{},g.charAt(0).toLocaleUpperCase('ru')+g.slice(1)),
      h('div',{className:'game-fields'},rows.map((r,i)=>h('div',{className:'game-field',key:g+i},h('small',{},r[0]),h('strong',{},String(r[1])+(r[2]?' '+r[2]:''))))))));}
 itemDetail(){const item=this.state.item;if(this.state.error)return this.failed();if(!item)return this.loading();
 return h('div',{className:'page game-page'},h('div',{className:'game-back'},h(Link,{to:'/game/items'},'← Все предметы')),
   this.intro(item.name,item.english||'Предмет из каталога Kingdom Come: Deliverance II','КАРТОЧКА ПРЕДМЕТА'),
   h('div',{className:'game-item-hero'},
     window.WikiExtraItemArt?h(window.WikiExtraItemArt,{item,admin:!!this.props.admin,size:'large'}):null,
     h('section',{className:'game-detail-block game-item-info'},h('h2',{},'Сведения'),
       h('div',{className:'game-fields'},
       this.field('Категория',item.categoryName?item.categoryName+(item.subName?' · '+item.subName:''):'—'),
       this.field('Вес',item.weight==null?'—':Number(item.weight).toLocaleString('ru-RU',{maximumFractionDigits:2})+' кг'),
       this.field('Базовая цена',fmtPrice(item.gamePrice)),
       this.field('Справочная цена',fmtPrice(item.referencePrice)),
       item.damage?this.field('Урон',fmtCount(item.damage)):null,
       this.field('Рецептов на выходе',fmtCount(item.recipeOutputs)),
       this.field('Используется в рецептах',fmtCount(item.recipeUses)),
       this.field('Внутренний код',item.internal?h('span',{className:'game-copy-val'},h('code',{},item.internal),h('button',{className:'game-field-copy',title:'Скопировать класснейм','aria-label':'Скопировать класснейм',onClick:()=>this.copy(item.internal,'cls')},this.state.copied==='cls'?'✓':'⧉')):'—'),
       this.field('GUID',h('span',{className:'game-copy-val'},h('code',{},item.id),h('button',{className:'game-field-copy',title:'Скопировать ID','aria-label':'Скопировать ID',onClick:()=>this.copy(item.id,'id')},this.state.copied==='id'?'✓':'⧉')))))),
   this.itemVariants(item),
   this.itemStats(item),
     this.state.related.length?h('section',{className:'game-relation'},h('h2',{},'Рецепты с этим предметом'),h('div',{className:'game-results'},this.state.related.map(r=>this.recipeRow(r)))):h('div',{className:'game-placeholder'},'В доступных экспортированных рецептах предмет не упоминается.'),
   null);
 }
 recipeDetail(){const r=this.state.recipe;if(this.state.error)return this.failed();if(!r)return this.loading();
 const out=(r.outputs||[])[0];return h('div',{className:'page game-page'},h('div',{className:'game-back'},h(Link,{to:'/game/recipes'},'← Все рецепты')),
   this.intro(r.name,r.craftName,'КАРТОЧКА РЕЦЕПТА'),
   h('section',{className:'game-detail-block'},h('h2',{},'Изготовление'),h('div',{className:'game-fields'},
       out?this.field('Изделие',h(WikiItemLink,{item:out})):null,
       this.field('Ремесло',r.craftName),this.field('Требуемый уровень',r.level??'—'),this.field('Выход изделий','× '+(r.amount||1)),
       this.field('Время',r.seconds==null?'—':r.seconds+' сек.'),this.field('Плата',fmtPrice(r.fee)),this.field('Опыт',r.xp==null?'—':'+'+r.xp))),
   this.recipeVariants(r),
   h('section',{className:'game-detail-block game-recipe-resources'},h('h2',{},'Необходимые материалы'),r.ingredients.length?h('div',{className:'game-ingredients'},r.ingredients.map((g,i)=>h('div',{className:'game-ingredient',key:i},h('span',{className:'game-ing-icon'},g.imageUrl?h('img',{src:wikiUrl(g.imageUrl),alt:'',loading:'lazy'}):'◈'),h('strong',{},h(WikiItemLink,{item:g})),h('small',{},'× '+g.amount)))):h('p',{},'Материалы в источнике не перечислены.')));
 }
 render(){if(this.props.mode==='item')return this.itemDetail();if(this.props.mode==='recipe')return this.recipeDetail();return this.catalog();}
}

class App extends React.Component{
 constructor(props){super(props);this.state={data:null,gameMeta:null,admin:false,view:currentPath(),search:'',topSearch:'',updatesQuery:'',updatesSort:'new',type:'all',category:'all',menuOpen:false,mobile:false,editing:null,form:null,busy:false,error:'',notice:'',login:false};this.onPop=()=>this.setState({view:currentPath(),mobile:false,menuOpen:false,category:'all',type:'all',notice:''});}
 componentDidMount(){window.addEventListener('popstate',this.onPop);if(window.KCD2RP_STATIC)window.addEventListener('hashchange',this.onPop);this.load();wikiFetch('/api/game/meta').then(r=>r.json()).then(d=>this.setState({gameMeta:d.meta||null})).catch(()=>{});wikiFetch('/api/me').then(x=>x.json()).then(x=>this.setState({admin:!!x.admin})).catch(()=>{});}
 componentWillUnmount(){window.removeEventListener('popstate',this.onPop);window.removeEventListener('hashchange',this.onPop)}
 load(){wikiFetch('/api/content').then(r=>{if(!r.ok)throw Error('Сервер не отвечает');return r.json()}).then(data=>this.setState({data})).catch(e=>this.setState({error:e.message}))}
 set(p){this.setState(p)}
 openSearch(value){const q=String(value||'').trim();navigate('/catalog');this.setState({search:q,topSearch:q,menuOpen:false});}
 notice(x){this.setState({notice:x,error:''});setTimeout(()=>{if(this.state.notice===x)this.setState({notice:''})},4500)}
 async action(path,method,payload){this.setState({busy:true,error:''});try{let r=await wikiFetch(path,{method,headers:{'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});let out=await r.json();if(!r.ok)throw Error(out.error||'Ошибка сервера');return out}catch(e){this.setState({error:e.message});return null}finally{this.setState({busy:false})}}
 loginOpen(){this.setState({login:true,error:''})}
 async login(e){e.preventDefault();let f=new FormData(e.currentTarget),result=await this.action('/api/login','POST',{username:f.get('username'),password:f.get('password')});if(result){this.setState({admin:true,login:false});this.load();this.notice('Вы вошли в управление энциклопедией')}}
 async logout(){await this.action('/api/logout','POST');this.setState({admin:false,login:false});this.load();this.notice('Вы вышли из панели редактора')}
 startEdit(a){let category=this.state.data.categories[0]?.id||'guides';let form=a?JSON.parse(JSON.stringify(a)):{title:'',slug:'',description:'',category,type:'article',tags:[],icon:'📖',published:true,featured:false,blocks:[{type:'text',value:''}]};this.setState({editing:a?a.id:'new',form,error:''});}
 async save(e){e.preventDefault();let {form,editing}=this.state;let result=await this.action(editing==='new'?'/api/articles':'/api/articles/'+editing,editing==='new'?'POST':'PUT',form);if(result){this.setState({editing:null,form:null});await this.load();navigate('/article/'+result.article.slug);this.notice('Статья сохранена')}}
 async remove(a){if(!confirm('Удалить статью «'+a.title+'»? Это действие нельзя отменить.'))return;let result=await this.action('/api/articles/'+a.id,'DELETE');if(result){this.setState({editing:null});this.load();navigate('/catalog');this.notice('Статья удалена')}}
 async importCatalogFile(e){const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>8000000){this.setState({error:'Файл слишком большой (лимит 8 МБ).'});e.target.value='';return;}try{const parsed=JSON.parse(await file.text());const data=parsed.catalog||parsed;if(!data.meta||!Array.isArray(data.items)||!Array.isArray(data.recipes))throw Error('Неверный формат каталога');if(!confirm('Загрузить каталог: '+data.items.length+' предметов и '+data.recipes.length+' рецептов? Текущий каталог будет сохранён в резервной копии, статьи останутся нетронутыми.'))return;const result=await this.action('/api/admin/game-catalog','POST',{catalog:data});if(result){this.notice('Каталоги обновлены: '+result.itemCount+' предметов, '+result.recipeCount+' рецептов.');}}catch(err){this.setState({error:err.message})}finally{e.target.value='';}}
 updateForm(key,value){this.setState(s=>({form:{...s.form,[key]:value}}))}
 updateBlock(i,key,value){this.setState(s=>({form:{...s.form,blocks:s.form.blocks.map((b,j)=>j===i?{...b,[key]:value}:b)}}))}
 addBlock(type){this.setState(s=>({form:{...s.form,blocks:[...s.form.blocks,type==='table'?{type,columns:['Название','Описание'],rows:[['','']]}:type==='gallery'?{type,items:[]}:{type,value:''}]}}))}
 removeBlock(i){this.setState(s=>({form:{...s.form,blocks:s.form.blocks.filter((b,j)=>j!==i)}}))}
 header(){
 const {admin,menuOpen,topSearch,view}=this.state;
 const home=view==='/';
 const nav=[['/catalog','Все статьи','book'],['/game/items','Предметы','package'],['/game/recipes','Рецепты','hammer'],['/animations','Анимации NPC','compass'],['/icons','Иконки KCD2','image'],['/map','Карта Богемии','map'],['/updates','История изменений','clock']];
 return h('header',{className:cls('topbar reference-header',home&&'ref-header-home')},h('div',{className:'ref-header-inner'},
  h(Link,{to:'/',className:'ref-logo','aria-label':'KCD2RP Wiki — главная'},h('span',{className:'ref-logo-word'},'KCD',h('b',{},'2'),'RP'),h('span',{className:'ref-logo-tag'},'wiki')),
  h('div',{className:'ref-nav-wrap'},h('button',{className:cls('ref-catalog-trigger',menuOpen&&'active'),type:'button',onClick:()=>this.set({menuOpen:!menuOpen}),'aria-expanded':menuOpen,'aria-haspopup':'true'},'Каталоги'),
   menuOpen&&h('div',{className:'ref-nav-dropdown'},nav.map(([to,name,icon])=>h(Link,{key:to,to,className:'ref-nav-item',onClick:()=>this.set({menuOpen:false})},h(Icon,{name:icon}),name)))),
  !home&&h('form',{className:'ref-top-search',onSubmit:e=>{e.preventDefault();this.openSearch(topSearch)}},h(Icon,{name:'search'}),h('input',{value:topSearch,onChange:e=>this.set({topSearch:e.target.value}),placeholder:'Поиск информации на сайте...', 'aria-label':'Поиск информации на сайте'}),h('button',{className:'ref-submit-search',type:'submit','aria-label':'Искать'},h(Icon,{name:'arrow'}))),
  h('div',{className:'ref-header-right'},h('button',{className:'ref-theme',title:'Переключить тему','aria-label':'Переключить тему',type:'button',onClick:()=>{let theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('kcd2rp-wiki-theme',theme)}catch(e){}this.forceUpdate()}},h(Icon,{name:document.documentElement.dataset.theme==='dark'?'moon':'sun'})),h('span',{className:'ref-lang'},'RU'),!window.KCD2RP_STATIC&&h('button',{className:'ref-editor-link',type:'button',title:'Редактор Wiki',onClick:()=>admin?navigate('/admin'):this.loginOpen()},h(Icon,{name:'globe'})))));
 }
 breadcrumb(){const {view,data}=this.state;if(view==='/')return 'Главная';if(view==='/catalog')return 'Все статьи';if(view.startsWith('/game/item/'))return 'Предмет';if(view.startsWith('/game/recipe/'))return 'Рецепт';if(view==='/game/items')return 'База предметов';if(view==='/game/recipes')return 'Рецепты KCD2';if(view==='/map'||view.startsWith('/map/'))return 'Карта Богемии';if(view==='/icons')return 'Иконки KCD2';if(view.startsWith('/animations'))return 'Анимации NPC';if(view==='/updates')return 'История изменений';if(view==='/admin')return 'Редактор';if(view.startsWith('/category/'))return data.categories.find(c=>c.id===decodeURIComponent(view.split('/')[2]))?.title||'Категория';if(view.startsWith('/article/'))return data.articles.find(a=>a.slug===decodeURIComponent(view.split('/')[2]))?.title||'Статья';return 'Энциклопедия';}
 home(){
 const {data,search}=this.state;
 const categories=data.categories||[];
 const chosen=[];
 const add=(tile)=>{if(!chosen.some(x=>x.to===tile.to))chosen.push(tile)};
 add({to:'/game/items',title:'Предметы',desc:'Оружие, материалы и другие игровые предметы',icon:'package'});
 add({to:'/game/recipes',title:'Рецепты',desc:'Чертежи и изготовление предметов',icon:'hammer'});
 for(const c of categories){if(c.id==='updates'||c.id==='items')continue;add({to:'/category/'+c.id,title:c.title,desc:c.description,icon:sectionIcon(c.id,c.title)});}
 add({to:'/animations',title:'Анимации NPC',desc:'Каталог игровых анимаций и клипов',icon:'compass'});
 add({to:'/icons',title:'Иконки KCD2',desc:'Библиотека изображений и интерфейсных элементов',icon:'image'});
 add({to:'/catalog',title:'Все статьи',desc:'Полный каталог энциклопедии Богемии',icon:'book'});
 const sections=[{to:'/map',title:'Карта',desc:'Троски, Кутна-Гора и исследование Богемии',icon:'map'},
 {to:'/updates',title:'История изменений',desc:'Обновления и изменения проекта',icon:'clock'},...chosen];
 // Города Богемии: клик открывает атлас с приближением к поселению, как в игре.
 const regions=[['Кутна-Гора','Кутногорский регион','kuttenberg'],['Тросковице','Тросецко','trosky'],['Замок Троски','Тросецко','trosky'],['Сухдол','Кутногорский регион','kuttenberg'],['Тахов','Тросецко','trosky'],['Седлецкий монастырь','Кутногорский регион','kuttenberg'],['Желеев','Тросецко','trosky'],['Малешов','Кутногорский регион','kuttenberg'],['Семин','Тросецко','trosky'],['Мышковицы','Кутногорский регион','kuttenberg'],['Небаковская крепость','Тросецко','trosky'],['Биланы','Кутногорский регион','kuttenberg']];
 return h('div',{className:'page home-page reference-home'},
 h('section',{className:'ref-hero'},h('img',{className:'ref-hero-illustration left',src:wikiUrl('/illustrations/pilgrim.svg'),alt:'',loading:'eager'}),
 h('div',{className:'ref-hero-center'},h('h1',{},'Общие категории'),h('p',{},'Здесь вы можете найти любую информацию о проекте KCD2RP, его игровом мире и сервере.'),
 h('form',{className:'ref-hero-search',onSubmit:e=>{e.preventDefault();this.openSearch(search)}},h(Icon,{name:'search'}),h('input',{value:search,onChange:e=>this.set({search:e.target.value}),placeholder:'Поиск информации на сайте...', 'aria-label':'Поиск по энциклопедии'}),h('button',{type:'submit',title:'Найти'},h(Icon,{name:'arrow'}))),
 h('div',{className:'ref-hero-prompts'},h(Link,{to:'/game/items'},'Предметы'),h(Link,{to:'/game/recipes'},'Рецепты'),h(Link,{to:'/animations'},'Анимации NPC'),h(Link,{to:'/map'},'Карта Богемии'))),
 h('img',{className:'ref-hero-illustration right',src:wikiUrl('/illustrations/wiki-pages.svg'),alt:'',loading:'eager'})),
 h('section',{className:'ref-region-marquee','aria-label':'Города Богемии'},h('div',{className:'ref-region-track'},[...regions,...regions].map(([name,desc,region],i)=>h(Link,{to:'/map/'+region+'/'+encodeURIComponent(name),key:i,className:'ref-region',title:'Открыть на карте: '+name},h(Icon,{name:'map'}),h('span',{},h('strong',{},name),h('small',{},desc)),h('i',{}))))),
 h('section',{className:'ref-home-categories'},h('div',{className:'ref-categories-grid'},
 h('a',{className:'ref-category wide',href:'kcdmp://connect/play.kcd2rp.ru:7777'},h('span',{className:'ref-category-head'},h(Icon,{name:'server'}),h('strong',{},'Сервер KCD2RP'),h(Icon,{name:'link'})),h('span',{className:'ref-category-description'},'Подключение к игровому миру Богемии')),
 sections.map(c=>h(Link,{to:c.to,key:c.to,className:'ref-category'},h('span',{className:'ref-category-head'},h(Icon,{name:c.icon}),h('strong',{},c.title),h(Icon,{name:'link'})),h('span',{className:'ref-category-description'},c.desc))))));
 }
 catalog(fixedCategory){const {data,search,category,type}=this.state;const current=fixedCategory||category;let c=fixedCategory?data.categories.find(x=>x.id===fixedCategory):null;
 let articles=data.articles.filter(a=>(current==='all'||a.category===current)&&(type==='all'||a.type===type));
 const q=search.trim().toLocaleLowerCase('ru');if(q)articles=articles.filter(a=>(a.title+' '+a.description+' '+a.tags.join(' ')+' '+a.blocks.map(b=>b.value||'').join(' ')).toLocaleLowerCase('ru').includes(q));
 return h('div',{className:'page catalog-page'},h('div',{className:'page-overline'},fixedCategory?'РАЗДЕЛ ЭНЦИКЛОПЕДИИ':'БИБЛИОТЕКА БОГЕМИИ'),h('div',{className:'catalog-heading'},h('div',{},h('h1',{},c?c.title:'Каталог знаний'),h('p',{},c?c.description:'Справочники, путеводители и статьи обо всех аспектах жизни в KCD2RP.')),this.state.admin&&h('button',{className:'outline-btn',onClick:()=>this.startEdit()},'+ Новая статья')),
 h('div',{className:'catalog-panel'},h(SearchInput,{value:search,onChange:v=>this.set({search:v}),placeholder:'Поиск по названию, содержимому и тегам…'}),
 h('div',{className:'filters'},!fixedCategory&&h('select',{value:category,onChange:e=>this.set({category:e.target.value})},[h('option',{key:'all',value:'all'},'Все категории')].concat(data.categories.map(c=>h('option',{key:c.id,value:c.id},c.title)))),h('select',{value:type,onChange:e=>this.set({type:e.target.value})},['all','article','catalog','guide','changelog'].map((v,i)=>h('option',{key:v,value:v},['Все форматы','Статьи','Каталоги','Руководства','Обновления'][i])))),
 h('div',{className:'catalog-meta'},h('span',{},'Найдено материалов: ',h('b',{},articles.length)),h('span',{},'Сортировка: по названию'))),
 articles.length?h('div',{className:'catalog-results'},articles.map(a=>h(ArticleCard,{key:a.id,a,categories:data.categories,compact:true}))):h('div',{className:'empty'},'⌕',h('h3',{},'Ничего не найдено'),h('p',{},'Попробуйте изменить поисковый запрос или фильтры.')));
 }
 article(slug){let {data,admin}=this.state;let a=data.articles.find(x=>x.slug===slug);if(!a)return this.notFound();let cat=data.categories.find(c=>c.id===a.category);let related=data.articles.filter(x=>x.category===a.category&&x.id!==a.id).slice(0,3);
 return h('div',{className:'page article-page'},h('div',{className:'article-breadcrumb'},h(Link,{to:'/catalog'},'Каталог'),h('span',{},'›'),h(Link,{to:'/category/'+a.category},cat?.title||'Раздел'),h('span',{},'›'),h('span',{className:'crumb-current'},a.title)),
 h('div',{className:'article-layout'},h('main',{className:'article-main'},h('div',{className:'article-hero'},h('span',{className:'article-category-tag'},cat?.icon||'◈','  ',cat?.title||'Энциклопедия'),h('h1',{},a.title),h('p',{},a.description),h('div',{className:'article-byline'},h('span',{},'◷  Обновлено '+new Date(a.updatedAt).toLocaleDateString('ru-RU')),h('span',{},'•'),h('span',{},'Материал энциклопедии'),admin&&h('button',{className:'inline-edit',onClick:()=>this.startEdit(a)},'✎ Редактировать'))),
 h('div',{className:'article-body'},a.blocks.map((block,i)=>h(Block,{key:i,block}))),
 h('div',{className:'article-tags'},(a.tags||[]).map(tag=>h('span',{key:tag},'# '+tag))),
 h('div',{className:'article-end'},h('span',{},'Конец статьи'),h(Link,{to:'/category/'+a.category},'Другие материалы раздела ↗')),
 related.length>0&&h('section',{className:'related'},h('h2',{},'Читайте также'),h('div',{className:'related-list'},related.map(x=>h(Link,{key:x.id,to:'/article/'+x.slug},h('span',{},x.icon),h('strong',{},x.title),h('span',{},'↗')))))),
 h('aside',{className:'article-aside'},h('div',{className:'toc'},h('span',{className:'eyebrow'},'НА ЭТОЙ СТРАНИЦЕ'),a.blocks.filter(b=>b.type==='heading').map((b,i)=>h('button',{key:i,onClick:()=>document.querySelectorAll('.article-heading')[i]?.scrollIntoView({behavior:'smooth',block:'start'})},b.value))),h('div',{className:'toc-help'},h('span',{},'✧'),h('strong',{},'База знаний KCD2RP'),h('p',{},'Нашли неточность? Сообщите администрации проекта, чтобы информация оставалась актуальной.')))));
 }
 notFound(){return h('div',{className:'page empty'},h('h1',{},'Страница не найдена'),h('p',{},'Возможно, материал был перемещён или ещё не опубликован.'),h(Link,{to:'/',className:'primary-btn'},'На главную'))}
 updates(){const {data}=this.state;const needle=(this.state.updatesQuery||'').trim().toLocaleLowerCase('ru');const history=data.articles.filter(a=>a.type==='changelog'&&(!needle||(a.title+' '+a.description+' '+(a.blocks||[]).map(b=>b.value||'').join(' ')).toLocaleLowerCase('ru').includes(needle))).slice().sort((a,b)=>(this.state.updatesSort==='old'?-1:1)*(new Date(b.updatedAt)-new Date(a.updatedAt)));const monthDays=126;const now=Date.now();const all=data.articles.filter(a=>a.updatedAt);const counter={};for(const a of all){const key=String(a.updatedAt||'').slice(0,10);if(key)counter[key]=(counter[key]||0)+1;}let cells=[];for(let i=monthDays-1;i>=0;i--){const date=new Date(now-i*86400000).toISOString().slice(0,10);cells.push(h('span',{key:date,className:cls('ref-history-square',(counter[date]||0)>0&&'has-updates'),title:date+' · '+(counter[date]||0)+' изменений'}));}return h('div',{className:'page ref-history-page'},h('h1',{},'История изменений'),h('div',{className:'ref-history-intro'},'Изменения материалов энциклопедии KCD2RP'),h('div',{className:'ref-history-heatmap'},h('div',{className:'ref-history-scale'},h('span',{},'Ранее'),h('span',{},'Недавно')),h('div',{className:'ref-history-squares'},cells),h('div',{className:'ref-history-legend'},h('span',{},h('i',{className:'ref-legend-dot'}),'Обновления статей'),h('small',{},'Данные только из Wiki'))),h('div',{className:'ref-history-filter'},h(Icon,{name:'search'}),h('input',{value:this.state.updatesQuery,onChange:e=>this.set({updatesQuery:e.target.value}),placeholder:'Поиск изменений...', 'aria-label':'Поиск изменений'}),h('select',{value:this.state.updatesSort,onChange:e=>this.set({updatesSort:e.target.value}),'aria-label':'Сортировка изменений'},h('option',{value:'new'},'Сначала новые'),h('option',{value:'old'},'Сначала старые'))),
 h('div',{className:'ref-history-timeline'},history.length?history.map((a,i)=>h('div',{className:'ref-history-entry',key:a.id},h('div',{className:'ref-history-date'},new Date(a.updatedAt).toLocaleDateString('ru-RU')),h('span',{className:'ref-history-node'}),h('div',{className:'ref-history-content'},h(Link,{to:'/article/'+a.slug,className:'ref-history-title'},h(Icon,{name:'file'}),a.title,h('span',{},'Читать больше ',h(Icon,{name:'arrow'}))),h('div',{className:'ref-history-body'},(a.blocks||[]).filter(b=>b.type==='text'||b.type==='list').slice(0,3).map((b,j)=>h('p',{key:j},b.type==='list'?b.value.split('\n')[0]:b.value)))))):h('div',{className:'ref-empty-updates'},needle?'Ничего не найдено по запросу.':'Пока нет опубликованных записей.')));}
 admin(){const {data,admin}=this.state;if(window.KCD2RP_STATIC)return h('div',{className:'page empty'},h('h1',{},'Публичная версия только для чтения'),h('p',{},'Редактирование статей и загрузка данных доступны в серверной Node-версии Wiki.'),h(Link,{to:'/',className:'primary-btn'},'На главную'));if(!admin)return h('div',{className:'page empty'},h('h1',{},'Доступ ограничен'),h('button',{className:'primary-btn',onClick:()=>this.loginOpen()},'Войти редактором'));
 return h('div',{className:'page admin-page'},h('div',{className:'page-overline'},'ПАНЕЛЬ УПРАВЛЕНИЯ'),h('div',{className:'catalog-heading'},h('div',{},h('h1',{},'Управление статьями'),h('p',{},'Редактируйте материалы энциклопедии. Изменения сразу публикуются на сайте.')),h('div',{className:'flex-actions'},h('button',{className:'outline-btn',onClick:()=>this.logout()},'Выйти'),h('button',{className:'primary-btn',onClick:()=>this.startEdit()},'+ Добавить материал'))),
 h('div',{className:'admin-stats'},h('div',{},h('small',{},'МАТЕРИАЛОВ'),h('strong',{},data.articles.length)),h('div',{},h('small',{},'РАЗДЕЛОВ'),h('strong',{},data.categories.length)),h('div',{},h('small',{},'ОПУБЛИКОВАНО'),h('strong',{},data.articles.filter(a=>a.published).length))),
 h('div',{className:'game-admin-import'},h('div',{},h('h3',{},'Импорт игровых каталогов'),h('p',{},'Загрузите JSON из инструмента tools/import_game_catalog.py. Существующие статьи, пользовательские правки и настройки разделов не изменятся. Перед заменой каталога сохраняется резервная копия.')),h('label',{},'⇧ Загрузить каталог',h('input',{type:'file',accept:'.json,application/json',onChange:e=>this.importCatalogFile(e)}))),
 h('div',{className:'admin-table'},data.articles.map(a=>h('div',{className:'admin-row',key:a.id},h('span',{className:'admin-row-icon'},a.icon),h('div',{},h('strong',{},a.title),h('small',{},data.categories.find(c=>c.id===a.category)?.title+' · '+(a.published?'Опубликовано':'Черновик'))),h('button',{onClick:()=>this.startEdit(a)},'Редактировать'),h(Link,{to:'/article/'+a.slug},'Открыть ↗')))));
 }
 editor(){const {form,editing,data,busy}=this.state;if(!form)return null;return h('div',{className:'modal-overlay',onClick:e=>{if(e.target===e.currentTarget)this.setState({editing:null})}},h('div',{className:'editor-modal'},
 h('div',{className:'modal-top'},h('div',{},h('small',{},'РЕДАКТОР КОНТЕНТА'),h('h2',{},editing==='new'?'Новая статья':'Редактирование статьи')),h('button',{onClick:()=>this.setState({editing:null}),className:'close-btn'},'×')),
 h('form',{onSubmit:e=>this.save(e),className:'editor-form'},h('div',{className:'field-row'},h('label',{},'Заголовок',h('input',{required:true,minLength:3,maxLength:140,value:form.title,onChange:e=>this.updateForm('title',e.target.value)})),h('label',{},'Адрес (slug)',h('input',{value:form.slug||'',placeholder:'Генерируется из заголовка',onChange:e=>this.updateForm('slug',e.target.value)}))),
 h('label',{},'Краткое описание',h('textarea',{rows:2,maxLength:400,value:form.description,onChange:e=>this.updateForm('description',e.target.value)})),
 h('div',{className:'field-row'},h('label',{},'Раздел',h('select',{value:form.category,onChange:e=>this.updateForm('category',e.target.value)},data.categories.map(c=>h('option',{key:c.id,value:c.id},c.title)))),h('label',{},'Тип страницы',h('select',{value:form.type,onChange:e=>this.updateForm('type',e.target.value)},[['article','Статья'],['catalog','Каталог'],['guide','Руководство'],['changelog','Обновления']].map(([id,t])=>h('option',{key:id,value:id},t))))),
 h('div',{className:'field-row'},h('label',{},'Иконка',h('input',{maxLength:3,value:form.icon,onChange:e=>this.updateForm('icon',e.target.value)})),h('label',{},'Теги (через запятую)',h('input',{value:(form.tags||[]).join(', '),onChange:e=>this.updateForm('tags',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}))),
 h('div',{className:'editor-flags'},h('label',{},h('input',{type:'checkbox',checked:form.published!==false,onChange:e=>this.updateForm('published',e.target.checked)}),' Опубликовать'),h('label',{},h('input',{type:'checkbox',checked:!!form.featured,onChange:e=>this.updateForm('featured',e.target.checked)}),' Рекомендовать на главной')),
 h('div',{className:'editor-blocks-head'},h('h3',{},'Содержание'),h('span',{},form.blocks.length+' блоков')),
 form.blocks.map((b,i)=>h('div',{className:'editor-block',key:i},h('div',{className:'editor-block-header'},h('select',{value:b.type,onChange:e=>this.setState(s=>({form:{...s.form,blocks:s.form.blocks.map((o,j)=>j===i?(e.target.value==='table'?{type:'table',columns:['Колонка 1','Колонка 2'],rows:[['','']]}:{type:e.target.value,value:''}):o)}}))},[['text','Текст'],['heading','Заголовок'],['list','Список (строки)'],['notice','Примечание'],['table','Таблица'],['image','Изображение'],['gallery','Галерея ссылок']].map(([key,text])=>h('option',{value:key,key},text))),h('button',{type:'button',onClick:()=>this.removeBlock(i)},'Удалить ×')),
 b.type==='table'?h('div',{className:'table-edit'},h('label',{},'Колонки (через |)',h('input',{value:(b.columns||[]).join(' | '),onChange:e=>this.updateBlock(i,'columns',e.target.value.split('|').map(x=>x.trim()))})),h('label',{},'Строки (одна на строку, столбцы через |)',h('textarea',{rows:5,value:(b.rows||[]).map(row=>row.join(' | ')).join('\n'),onChange:e=>this.updateBlock(i,'rows',e.target.value.split('\n').filter(Boolean).map(row=>row.split('|').map(x=>x.trim())))}))):b.type==='gallery'?h('label',{},'Карточки (картинка | заголовок | подпись | ссылка — одна на строку)',h('textarea',{rows:6,value:(b.items||[]).map(x=>[x.image||'',x.title||'',x.subtitle||'',x.to||''].join(' | ')).join('\n'),onChange:e=>this.updateBlock(i,'items',e.target.value.split('\n').filter(Boolean).map(line=>{const p=line.split('|').map(x=>x.trim());return {image:p[0]||'',title:p[1]||'',subtitle:p[2]||'',to:p[3]||''};}))})):h('textarea',{rows:b.type==='heading'?2:5,value:b.value||'',onChange:e=>this.updateBlock(i,'value',e.target.value),placeholder:b.type==='list'?'Каждый пункт с новой строки':b.type==='image'?'Адрес изображения, например /media/factions/название.webp':'Текст блока…'}))),
 h('div',{className:'editor-add'},[['text','Текст'],['heading','Заголовок'],['list','Список'],['notice','Примечание'],['table','Таблица'],['image','Изображение'],['gallery','Галерея']].map(([typ,label])=>h('button',{key:typ,type:'button',onClick:()=>this.addBlock(typ)},'＋ '+label))),
 h('div',{className:'editor-actions'},editing!=='new'&&h('button',{type:'button',className:'danger-btn',onClick:()=>this.remove(form)},'Удалить статью'),h('span',{className:'editor-spacer'}),h('button',{type:'button',className:'outline-btn',onClick:()=>this.setState({editing:null})},'Отмена'),h('button',{type:'submit',className:'primary-btn',disabled:busy},busy?'Сохранение…':'Сохранить статью')))));
 }
 loginModal(){if(!this.state.login)return null;return h('div',{className:'modal-overlay',onClick:e=>{if(e.target===e.currentTarget)this.set({login:false})}},h('div',{className:'login-modal'},h('button',{className:'login-close',onClick:()=>this.set({login:false})},'×'),h('span',{className:'login-mark'},'K'),h('div',{className:'page-overline'},'KCD2RP / WIKI'),h('h2',{},'Вход для редакторов'),h('p',{},'Только авторизованные сотрудники могут изменять содержимое энциклопедии.'),h('form',{onSubmit:e=>this.login(e)},h('label',{},'Логин',h('input',{name:'username',autoComplete:'username',required:true,defaultValue:'admin'})),h('label',{},'Пароль',h('input',{type:'password',name:'password',autoComplete:'current-password',required:true})),h('button',{type:'submit',className:'primary-btn',disabled:this.state.busy},'Войти в панель'))))}
 render(){const {data,view,mobile,error,notice}=this.state;if(!data)return h('div',{className:'app-loading'},h('span',{className:'brand-logo'},'K'),h('h2',{},error||'Загружаем летопись Богемии…'),error&&h('button',{onClick:()=>this.load()},'Повторить'));
 let body;if(view==='/')body=this.home();else if(view==='/catalog')body=this.catalog();else if(view==='/updates')body=this.updates();else if(view==='/icons')body=window.WikiIconsPage?h(window.WikiIconsPage):this.notFound();else if(view==='/map'||view.startsWith('/map/'))body=window.WikiExtraMap?h(window.WikiExtraMap,{key:view,admin:this.state.admin,focus:view.startsWith('/map/')?{region:decodeURIComponent(view.split('/')[2]||''),place:decodeURIComponent(view.split('/')[3]||'')}:null}):this.notFound();else if(view==='/animations'||view.startsWith('/animations/'))body=window.WikiExtraAnimations?h(window.WikiExtraAnimations,{key:'animations',clip:view.startsWith('/animations/')?decodeURIComponent(view.slice('/animations/'.length)):null}):this.notFound();else if(view==='/admin')body=this.admin();else if(view==='/game/items')body=h(GameCatalogPage,{key:view,mode:'items',admin:this.state.admin});else if(view==='/game/recipes')body=h(GameCatalogPage,{key:view,mode:'recipes'});else if(view.startsWith('/game/item/'))body=h(GameCatalogPage,{key:view,mode:'item',admin:this.state.admin,id:decodeURIComponent(view.slice('/game/item/'.length))});else if(view.startsWith('/game/recipe/'))body=h(GameCatalogPage,{key:view,mode:'recipe',id:decodeURIComponent(view.slice('/game/recipe/'.length))});else if(view.startsWith('/category/'))body=this.catalog(decodeURIComponent(view.split('/')[2]));else if(view.startsWith('/article/'))body=this.article(decodeURIComponent(view.split('/')[2]));else body=this.notFound();
 return h('div',{className:'app-shell ref-app-shell'},h('div',{className:'workarea'},this.header(),h('div',{className:'scroll-area'},body,h('footer',{className:'footer'},h('span',{},'© 2026 KCD2RP · Энциклопедия Богемии'),h('div',{},h(Link,{to:'/catalog'},'Все статьи'),h(Link,{to:'/updates'},'Изменения'),h('a',{href:'https://kcd2rp.ru',target:'_blank',rel:'noopener noreferrer'},'Основной сайт ↗'))))),error&&h('div',{className:'toast error',onClick:()=>this.set({error:''})},error,' ×'),notice&&h('div',{className:'toast'},notice),this.loginModal(),this.editor());}
}
try{document.documentElement.dataset.theme=localStorage.getItem('kcd2rp-wiki-theme')||'light'}catch(e){document.documentElement.dataset.theme='light'}
ReactDOM.render(h(App),document.getElementById('app'));
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector('.ref-top-search input')?.focus()}});
})();
