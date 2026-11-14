/* KCD2RP Wiki v0.3 · animation reference, offline tiled atlas, item artwork. React 16-compatible. */
(function(){
'use strict';
const WIKI_BASE=String(window.KCD2RP_WIKI_BASE||'').replace(/\/+$/,'');
const wikiUrl=u=>typeof u==='string'&&u.startsWith('/')&&!u.startsWith('//')?WIKI_BASE+u:u;
const wikiFetch=(u,options)=>window.KCD2RPStaticAPI?window.KCD2RPStaticAPI.fetch(u,options):fetch(wikiUrl(u),options);
const h=React.createElement;
const navigate=href=>window.KCD2RPNavigate?window.KCD2RPNavigate(href):window.location.assign(wikiUrl(href));
const fmt=n=>Number(n||0).toLocaleString('ru-RU');
const MAP_ASSETS=location.protocol==='file:'?'./maps/':wikiUrl('/maps/');
const familyNames={motion:'Движение',other:'Прочие',combat:'Бой',adlg:'Диалоги',quest:'Задания',horse:'Лошади',tournament:'Турниры',hit:'Реакции на удар',camp:'Лагерь',stand:'Стойка',free:'Свободные'};
const familyLabel=x=>familyNames[x]||x;
const iconFor={settlement:'⌂',landmark:'◆',transport:'♞',other:'✦'};
const errorMessage=async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Сервер временно недоступен');return body;};

const poseNames={stand:'Стоя',sit:'Сидя',lie:'Лёжа',sleep:'Сон',kneel:'На коленях',crouch:'Присев',horse:'Верхом',lean:'Опираясь'};
const kindNames={static:'Стойка',move:'Движение',action:'Действие'};
const phaseShort={'Ожидание / поза':'Ожидание','Цикл':'Цикл','Вход / начало':'Начало','Действие / переход':'Действие','Выход / завершение':'Завершение','Вариант':'Вариант','Переход':'Переход'};
const ANIM_EMPTY={q:'',family:'',cat:'',sub:'',kind:'',phase:'',pose:''};
const capRu=s=>s?s.charAt(0).toLocaleUpperCase('ru')+s.slice(1):s;

class Animations extends React.Component{
 constructor(props){super(props);this.state={...ANIM_EMPTY,page:1,rows:[],total:0,pages:1,meta:null,detail:null,loading:true,error:''};this.seq=0;this.timer=null;}
 componentDidMount(){wikiFetch('/api/animations/meta').then(errorMessage).then(meta=>this.setState({meta})).catch(()=>{});this.search();if(this.props.clip)this.detail(this.props.clip);}
 componentDidUpdate(prev){if(prev.clip!==this.props.clip){if(this.props.clip)this.detail(this.props.clip);else this.setState({detail:null});}}
 componentWillUnmount(){clearTimeout(this.timer);this.seq++;}
 search(){const id=++this.seq,s=this.state,params=new URLSearchParams({q:s.q,family:s.family,cat:s.cat,sub:s.sub,kind:s.kind,phase:s.phase,pose:s.pose,page:String(s.page),limit:'30'});
  this.setState({loading:true,error:''});wikiFetch('/api/animations?'+params).then(errorMessage).then(data=>{if(id!==this.seq)return;this.setState({rows:data.rows,total:data.total,pages:data.pages,loading:false});}).catch(err=>{if(id===this.seq)this.setState({loading:false,error:err.message})});}
 change(key,value){const update={[key]:value,page:1};if(key==='cat')update.sub='';this.setState(update,()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.search(),key==='q'?180:0);});}
 toggle(key,value){this.change(key,this.state[key]===value?'':value);}
 resetFilters(){this.setState({...ANIM_EMPTY,page:1},()=>this.search());}
 page(n){this.setState({page:n},()=>this.search());}
 detail(clip){this.setState({detail:null,error:''});wikiFetch('/api/animations/'+encodeURIComponent(clip)).then(errorMessage).then(d=>this.setState({detail:d.animation})).catch(e=>this.setState({error:e.message}));}
 copy(clip){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(clip).catch(()=>{});else{const input=document.createElement('textarea');input.value=clip;document.body.append(input);input.select();document.execCommand('copy');input.remove()}}
 chips(label,map,key){const s=this.state;return h('div',{className:'extra-chip-group',key:key},h('span',{className:'extra-chip-label'},label),Object.entries(map).map(([value,name])=>
   h('button',{key:value,className:'extra-chip'+(s[key]===value?' active':''),onClick:()=>this.toggle(key,value)},name)));}
 render(){const s=this.state,a=s.detail,catalog=s.meta?.catalog||[];
  const activeCat=catalog.find(c=>c.name===s.cat);
  const filtersOn=Object.keys(ANIM_EMPTY).some(k=>s[k]);
  const head=h('div',{className:'game-title'},h('span',{className:'page-overline'},'KCD2 / АНИМАЦИИ NPC'),h('h1',{},'Библиотека анимаций'),h('p',{},'Все 9 006 клипов KCD2 с русскими названиями и описаниями. Поиск по названию и внутреннему коду, фильтры по категории, типу, фазе и позе — как в игровой базе.'));
  return h('div',{className:'page extra-page'},head,
    h('div',{className:'extra-kpis'},h('div',{},h('small',{},'КЛИПОВ В КАТАЛОГЕ'),h('strong',{},fmt(s.meta?.count||9006))),h('div',{},h('small',{},'КАТЕГОРИЙ'),h('strong',{},fmt(catalog.length||37))),h('div',{},h('small',{},'ПО НАСТРОЙКАМ'),h('strong',{},fmt(s.total)))),
    h('div',{className:'extra-tabs'},h('a',{href:wikiUrl('/game/items'),onClick:e=>{e.preventDefault();navigate('/game/items')}},'Предметы'),h('a',{href:wikiUrl('/game/recipes'),onClick:e=>{e.preventDefault();navigate('/game/recipes')}},'Рецепты'),h('span',{className:'active'},'Анимации NPC')),
    h('div',{className:'extra-filters'},
      h('label',{},'Поиск клипа',h('input',{value:s.q,placeholder:'Например: кузнец, молитва, idle, sit…',onChange:e=>this.change('q',e.target.value),'aria-label':'Поиск анимаций'})),
      h('label',{},'Категория',h('select',{value:s.cat,onChange:e=>this.change('cat',e.target.value)},h('option',{value:''},'Все категории'),catalog.map(c=>h('option',{value:c.name,key:c.name},(c.icon?c.icon+' ':'')+c.name+' · '+fmt(c.count))))),
      h('label',{},'Подкатегория',h('select',{value:s.sub,disabled:!activeCat,onChange:e=>this.change('sub',e.target.value)},h('option',{value:''},activeCat?'Все подкатегории':'Сначала категория'),(activeCat?.subs||[]).map(x=>h('option',{value:x[0],key:x[0]},x[0]+' · '+fmt(x[1]))))),
      h('label',{},'Семейство',h('select',{value:s.family,onChange:e=>this.change('family',e.target.value)},h('option',{value:''},'Все семейства'),Object.entries(s.meta?.families||{}).map(([k,n])=>h('option',{value:k,key:k},familyLabel(k)+' · '+fmt(n))))),
      h('span',{className:'extra-filter-count'},fmt(s.total)+' найдено')),
    h('div',{className:'extra-chips'},
      this.chips('Тип',kindNames,'kind'),
      this.chips('Фаза',Object.fromEntries(Object.entries(phaseShort).map(([full,short])=>[full,short])),'phase'),
      this.chips('Поза',poseNames,'pose'),
      filtersOn&&h('button',{className:'extra-chip extra-chip-reset',onClick:()=>this.resetFilters()},'✕ Сбросить всё')),
    s.error&&h('div',{className:'extra-alert'},s.error),
    this.props.clip&&h('section',{className:'extra-animation-detail'},h('button',{className:'extra-back',onClick:()=>navigate('/animations')},'← Ко всем анимациям'),a?h('div',{},
      h('span',{className:'page-overline'},'КАРТОЧКА АНИМАЦИИ'),
      h('h2',{},(a.catIcon?a.catIcon+' ':'')+capRu(a.ru||a.clip)),
      h('p',{className:'extra-clip-code'},h('code',{},a.clip)),
      a.desc&&h('p',{},a.desc),
      h('div',{className:'extra-tags'},[
        a.cat&&h('span',{key:'cat'},(a.catIcon||'')+' '+a.cat),a.sub&&h('span',{key:'sub'},a.sub),
        a.kind&&h('span',{key:'kind'},kindNames[a.kind]||a.kind),a.phase&&h('span',{key:'ph'},a.phase),
        a.pose&&h('span',{key:'pose'},poseNames[a.pose]||a.pose),...a.families.map(x=>h('span',{key:x},familyLabel(x)))]),
      (a.tags||[]).length?h('p',{className:'extra-anim-tagline'},'Метки: '+a.tags.join(' · ')):null,
      h('p',{},'Фрагменты: '+(a.fragments.length?a.fragments.join(' · '):'не указаны')),
      h('button',{className:'extra-primary',onClick:()=>this.copy(a.clip)},'Скопировать ID клипа')):h('p',{},'Загрузка карточки…')),
    h('div',{className:'extra-animations-list'},
      h('div',{className:'extra-list-header'},h('span',{},'АНИМАЦИЯ / КЛИП'),h('span',{},'КАТЕГОРИЯ'),h('span',{},'ДЕЙСТВИЕ')),
      s.loading?h('div',{className:'extra-empty'},'Загрузка анимаций…'):s.rows.length?s.rows.map((row,i)=>h('div',{className:'extra-animation-row',key:row.clip},
        h('button',{className:'extra-animation-name',title:'Открыть карточку',onClick:()=>navigate('/animations/'+encodeURIComponent(row.clip))},
          h('span',{className:'extra-row-num'},String((s.page-1)*30+i+1).padStart(3,'0')),
          h('span',{className:'extra-anim-main'},
            h('strong',{className:'extra-anim-ru'},row.ru||row.clip),
            h('code',{},row.clip),
            h('span',{className:'extra-anim-badges'},[
              row.sub&&h('em',{key:'sub'},row.sub),
              row.kind&&h('em',{key:'kind'},kindNames[row.kind]||row.kind),
              row.phase&&h('em',{key:'ph'},phaseShort[row.phase]||row.phase),
              row.pose&&h('em',{key:'pose'},poseNames[row.pose]||row.pose)]))),
        h('span',{className:'extra-family',title:row.cat||''},(row.catIcon?row.catIcon+' ':'')+(row.cat||row.families.map(familyLabel).join(', '))),
        h('button',{className:'extra-copy',onClick:()=>this.copy(row.clip),title:'Скопировать название анимации'},'⧉ Копировать'))):h('div',{className:'extra-empty'},'Совпадений не найдено')),
    h('nav',{className:'extra-pager','aria-label':'Страницы анимаций'},h('button',{disabled:s.page<=1,onClick:()=>this.page(s.page-1)},'← Назад'),h('span',{},'Страница '+s.page+' из '+s.pages),h('button',{disabled:s.page>=s.pages,onClick:()=>this.page(s.page+1)},'Вперёд →')),
    h('p',{className:'extra-source'},'Источник: каталог KCD:MP + база KCD2BaseItem (русские названия, описания и классификация) · импорт '+(s.meta?.imported||'2026-10-23')+'. Указаны внутренние имена, не гарантированные действия для каждой модели.'));
 }
}

class MapPage extends React.Component{
 constructor(props){super(props);this.state={region:(props.focus&&(props.focus.region==='trosky'||props.focus.region==='kuttenberg')?props.focus.region:'trosky'),meta:null,markers:[],zoom:1,tx:0,ty:0,candidate:null,placing:false,name:'',category:'settlement',chosen:null,busy:false,error:'',notice:''};this.viewport=null;this.drag=null;this.flight=0;this.handleWheel=this.handleWheel.bind(this);this.handleResize=this.handleResize.bind(this);this.attachViewport=this.setViewport.bind(this);this.boundDown=this.down.bind(this);this.boundMove=this.move.bind(this);this.boundUp=this.up.bind(this);}
 componentDidMount(){this.load();this.handleResize();window.addEventListener('resize',this.handleResize);}
 componentWillUnmount(){window.removeEventListener('resize',this.handleResize);cancelAnimationFrame(this.flight);this.setViewport(null);}
 load(){wikiFetch('/api/maps/meta').then(errorMessage).then(res=>this.setState({meta:res,markers:res.markers||[]},()=>requestAnimationFrame(()=>{this.centerMap();const f=this.props.focus;if(f&&f.place)requestAnimationFrame(()=>this.flyTo(f.place));}))).catch(e=>this.setState({error:e.message}));}
 // Smooth fly-in to a named place, like opening the in-game map on a settlement.
 flyTo(place,zoomTarget){const region=this.state.meta?.regions?.[this.state.region];const l=(region?.labels||[]).find(x=>x.name===place);if(l)this.animateTo(l.x,l.y,zoomTarget||3.2);}
 animateTo(nx,ny,zoomTarget){const start=this.metrics();if(!start)return;cancelAnimationFrame(this.flight);
  const z0=this.state.zoom,t0=performance.now(),dur=1150;
  const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
   const zoom=z0+(zoomTarget-z0)*e,m=this.metrics();if(!m)return;
   const scale=m.fit*zoom,tx=m.w/2-nx*m.cols*1024*scale,ty=m.h/2-ny*m.rows*1024*scale;
   this.setState({zoom,...this.clamp(tx,ty,scale)});
   if(k<1)this.flight=requestAnimationFrame(step);};
  this.flight=requestAnimationFrame(step);}
 setViewport(ref){
  if(this.viewport===ref)return;
  if(this.viewport){this.viewport.removeEventListener('wheel',this.handleWheel);this.viewport.removeEventListener('pointerdown',this.boundDown);this.viewport.removeEventListener('pointermove',this.boundMove);this.viewport.removeEventListener('pointerup',this.boundUp);this.viewport.removeEventListener('pointercancel',this.boundUp);}
  this.viewport=ref;
  if(ref){
   // React 16.0 doesn't support synthetic PointerEvent handlers: register native listeners.
   ref.addEventListener('wheel',this.handleWheel,{passive:false});ref.addEventListener('pointerdown',this.boundDown);ref.addEventListener('pointermove',this.boundMove);ref.addEventListener('pointerup',this.boundUp);ref.addEventListener('pointercancel',this.boundUp);
   requestAnimationFrame(()=>{if(this.viewport===ref&&this.state.meta)this.centerMap()});
  }
 }
 size(region=this.state.region){const r=this.state.meta?.regions?.[region];return r?{w:r.cols*r.tileSize,h:r.rows*r.tileSize,cols:r.cols,rows:r.rows}:null;}
 metrics(){const v=this.viewport,dim=this.size();if(!v||!dim)return null;const w=v.clientWidth||750,h=v.clientHeight||610;const fit=Math.min(w/dim.w,h/dim.h)*.96;return {...dim,w,h,fit,scale:fit*this.state.zoom};}
 clamp(tx,ty,scale=this.metrics()?.scale){const m=this.metrics();if(!m)return {tx,ty};
  const width=m.w, height=m.h,mapW=m.w?m.cols*1024*scale:0,mapH=m.rows*1024*scale;
  return {tx:mapW<=width?(width-mapW)/2:Math.max(width-mapW-22,Math.min(22,tx)),ty:mapH<=height?(height-mapH)/2:Math.max(height-mapH-22,Math.min(22,ty))};
 }
 centerMap(){const m=this.metrics();if(!m)return;
  const x=(m.w-m.cols*1024*m.fit*this.state.zoom)/2,y=(m.h-m.rows*1024*m.fit*this.state.zoom)/2;
  this.setState({...this.clamp(x,y),zoom:this.state.zoom});
 }
 handleResize(){this.forceUpdate();}
 switchRegion(region){this.setState({region,zoom:1,candidate:null,placing:false,chosen:null},()=>requestAnimationFrame(()=>this.centerMap()));}
 zoomAt(next,px,py){const m=this.metrics();if(!m)return;const zoom=Math.min(6,Math.max(.8,next));const old=m.scale,now=m.fit*zoom;
  const newX=px-((px-this.state.tx)/old)*now,newY=py-((py-this.state.ty)/old)*now;
  this.setState({zoom,...this.clamp(newX,newY,now)});
 }
 handleWheel(e){e.preventDefault();cancelAnimationFrame(this.flight);const b=this.viewport.getBoundingClientRect();this.zoomAt(this.state.zoom*(e.deltaY<0?1.16:1/1.16),e.clientX-b.left,e.clientY-b.top);}
 down(e){if(e.button!==0)return;cancelAnimationFrame(this.flight);this.drag={sx:e.clientX,sy:e.clientY,tx:this.state.tx,ty:this.state.ty,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}
 move(e){if(!this.drag)return;const dx=e.clientX-this.drag.sx,dy=e.clientY-this.drag.sy;if(Math.hypot(dx,dy)>4)this.drag.moved=true;
  if(this.drag.moved)this.setState(this.clamp(this.drag.tx+dx,this.drag.ty+dy));
 }
 up(e){if(!this.drag)return;const moved=this.drag.moved;this.drag=null;try{e.currentTarget.releasePointerCapture(e.pointerId);}catch{}
  if(!moved&&this.state.placing){const m=this.metrics();if(!m)return;const b=this.viewport.getBoundingClientRect();// The atlas bitmap dimensions define the normalized point, not viewport size.
    const px=(e.clientX-b.left-this.state.tx)/(m.scale*(m.cols*1024)),py=(e.clientY-b.top-this.state.ty)/(m.scale*(m.rows*1024));
    if(px>=0&&px<=1&&py>=0&&py<=1)this.setState({candidate:{x:px,y:py},placing:false,notice:'Метка выбрана. Задайте название и сохраните.'});
  }
 }
 focusMarker(marker){const m=this.metrics();if(!m)return;const tx=m.w/2-marker.x*m.cols*1024*m.scale,ty=m.h/2-marker.y*m.rows*1024*m.scale;
  this.setState({chosen:marker.id,...this.clamp(tx,ty)});
 }
 async saveMarker(){if(!this.state.candidate||this.state.name.trim().length<2)return this.setState({error:'Укажите название метки'});
  this.setState({busy:true,error:''});try{const result=await wikiFetch('/api/maps/markers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({region:this.state.region,name:this.state.name.trim(),category:this.state.category,...this.state.candidate})}).then(errorMessage);
  this.setState(s=>({markers:[...s.markers,result.marker],candidate:null,name:'',busy:false,notice:'Метка сохранена на сервере'}));}catch(e){this.setState({busy:false,error:e.message});}}
 async removeMarker(id){if(!confirm('Удалить эту метку?'))return;this.setState({busy:true,error:''});try{await wikiFetch('/api/maps/markers/'+id,{method:'DELETE'}).then(errorMessage);this.setState(s=>({markers:s.markers.filter(m=>m.id!==id),busy:false,chosen:null,notice:'Метка удалена'}));}catch(e){this.setState({busy:false,error:e.message});}}
 render(){
  const s=this.state,m=this.metrics(),region=s.meta?.regions?.[s.region],markers=s.markers.filter(x=>x.region===s.region);
  const scale=m?.scale||.2,w=(region?.cols||4)*1024,ht=(region?.rows||4)*1024;
  const assets=s.zoom<1.75?
   h('img',{className:'wiki-map-overview',src:MAP_ASSETS+s.region+'/overview.webp',alt:'Карта '+(region?.title||s.region),draggable:false,style:{width:w,height:ht}}):
   Array.from({length:region?.rows||0},(_,row)=>Array.from({length:region?.cols||0},(_,col)=>
    h('img',{key:row+'-'+col,className:'wiki-map-tile',src:MAP_ASSETS+s.region+'/tile_'+row+'_'+col+'.jpg',alt:'',draggable:false,style:{left:col*1024,top:row*1024,width:1024,height:1024}})));
  const markerElements=markers.map(marker=>h('button',{key:marker.id,className:'wiki-map-pin'+(s.chosen===marker.id?' selected':''),style:{left:marker.x*w,top:marker.y*ht},
    onPointerDown:e=>e.stopPropagation(),onClick:e=>{e.stopPropagation();this.focusMarker(marker)},title:marker.name},
    h('span',{},iconFor[marker.category]||'◆'),h('small',{},marker.name)));
  // Place-name banners in the in-game map style: constant on-screen size via inverse scale.
  const labelScale=Math.min(1/scale,5.4),showMinor=s.zoom>=1.5;
  const labelElements=(region?.labels||[]).filter(l=>showMinor||(l.kind!=='minor'&&l.kind!=='water')).map((l,i)=>
   h('div',{key:'town'+i,className:'wiki-map-town kind-'+(l.kind||'village'),style:{left:l.x*w,top:l.y*ht,transform:`scale(${labelScale}) translate(-50%,-118%)`}},
    l.kind==='water'?h('em',{},l.name):h('span',{className:'wiki-map-town-scroll',title:'Приблизить: '+l.name,
     onPointerDown:e=>e.stopPropagation(),onClick:e=>{e.stopPropagation();this.animateTo(l.x,l.y,Math.max(3.2,Math.min(6,s.zoom*1.45)))}},
     h('i',{},l.kind==='city'||l.kind==='town'?'⍟':l.kind==='castle'?'♜':'◆'),l.name)));
  const stage=h('div',{className:'wiki-map-stage',style:{width:w,height:ht,transform:`translate(${s.tx}px, ${s.ty}px) scale(${scale})`}},
   assets,labelElements,markerElements,s.candidate&&h('div',{className:'wiki-map-pin candidate',style:{left:s.candidate.x*w,top:s.candidate.y*ht}},
    h('span',{},'✚'),h('small',{},s.name||'Новая точка')));
  const toolbar=h('div',{className:'wiki-map-toolbar'},h('span',{},'✧ '+(region?.title||'Регион')),
    h('small',{},'ЛКМ — перемещение · Колесо — масштаб'),
    h('button',{onClick:()=>{const mm=this.metrics();if(mm)this.zoomAt(s.zoom*1.25,mm.w/2,mm.h/2)},'aria-label':'Приблизить'},'+'),
    h('button',{onClick:()=>{const mm=this.metrics();if(mm)this.zoomAt(s.zoom/1.25,mm.w/2,mm.h/2)},'aria-label':'Отдалить'},'−'),
    h('button',{onClick:()=>this.setState({zoom:1},()=>this.centerMap()),title:'Сбросить масштаб'},'⌖'));
  const viewport=h('div',{className:'wiki-map-viewport',ref:this.attachViewport,style:{cursor:s.placing?'crosshair':'grab'}},
    stage,s.placing&&h('div',{className:'wiki-map-place-label'},'Нажмите на карту, чтобы отметить место'));
  const main=h('section',{className:'wiki-map-main'},toolbar,viewport,
    h('div',{className:'wiki-map-caption'},'Карта из архива сервера · позиция игроков не передаётся · Масштаб '+Math.round(s.zoom*100)+'%'));
  const listed=markers.length?
   h('div',{className:'wiki-map-pin-list'},markers.map(marker=>h('button',{key:marker.id,className:s.chosen===marker.id?'selected':'',onClick:()=>this.focusMarker(marker)},
    h('span',{},iconFor[marker.category]),h('span',{},marker.name),
    this.props.admin&&h('span',{className:'wiki-map-delete',onClick:e=>{e.stopPropagation();this.removeMarker(marker.id)}},'×')))):
   h('div',{className:'wiki-map-no-pins'},h('span',{},'⌖'),h('strong',{},'Метки пока не нанесены'),
    h('p',{},'На карте не отображаются вымышленные координаты. Редактор может отметить места по проверенной позиции.'));
  const editor=this.props.admin&&h('div',{className:'wiki-map-editor'},
   h('span',{className:'page-overline'},'РЕДАКТОР КАРТЫ'),
   h('label',{},'Название',h('input',{value:s.name,maxLength:80,placeholder:'Например: Троски',onChange:e=>this.setState({name:e.target.value})})),
   h('label',{},'Категория',h('select',{value:s.category,onChange:e=>this.setState({category:e.target.value})},
     [['settlement','Город или деревня'],['landmark','Достопримечательность'],['transport','Перевозчик'],['other','Другое']].map(([id,title])=>h('option',{key:id,value:id},title)))),
   h('button',{className:'extra-outline',onClick:()=>this.setState({placing:true,candidate:null,notice:'Нажмите на карту, чтобы выбрать точку'})},s.placing?'Выберите место на карте…':'◎ Указать позицию'),
   s.candidate&&h('small',{},'Точка: '+Math.round(s.candidate.x*1000)/10+'% / '+Math.round(s.candidate.y*1000)/10+'%'),
   h('button',{className:'extra-primary',disabled:s.busy||!s.candidate,onClick:()=>this.saveMarker()},'Сохранить метку'));
  const side=h('aside',{className:'wiki-map-side'},
    h('div',{className:'wiki-map-side-head'},h('span',{className:'page-overline'},'ИНТЕРАКТИВНЫЙ АТЛАС'),h('h2',{},'Точки интереса'),
      h('p',{},'Отмеченные редактором населённые пункты, ориентиры и станции перевозок.')),
    listed,editor,s.notice&&h('div',{className:'extra-success'},s.notice),s.error&&h('div',{className:'extra-alert'},s.error),
    h('p',{className:'wiki-map-disclaimer'},'Для автоматического отображения координат X/Y нужна подтверждённая калибровка по точкам из игры. Ложный маркер персонажа не рисуется.'));
  return h('div',{className:'page extra-page wiki-map-page'},
    h('div',{className:'game-title'},h('span',{className:'page-overline'},'ГЕОГРАФИЯ БОГЕМИИ / АТЛАС'),h('h1',{},'Карта королевства'),
      h('p',{},'Карты из игрового архива KCD2RP. Перемещайте карту мышью и масштабируйте колёсиком. Метки на Wiki добавляются редактором вручную и не являются координатами игроков в реальном времени.')),
    h('div',{className:'wiki-map-switch'},Object.entries(s.meta?.regions||{trosky:{title:'Троски'},kuttenberg:{title:'Кутна-Гора'}}).map(([key,r])=>
      h('button',{key,className:s.region===key?'selected':'',onClick:()=>this.switchRegion(key)},r.title))),
    h('div',{className:'wiki-map-layout'},main,side));
 }

}

class ItemArt extends React.Component{
 constructor(p){super(p);this.state={url:p.item.imageUrl||null,busy:false,error:''};}
 componentDidUpdate(prev){if(prev.item.id!==this.props.item.id)this.setState({url:this.props.item.imageUrl||null,error:''});}
 async upload(file){if(!file)return;if(file.size>2097152||!['image/png','image/jpeg','image/webp'].includes(file.type))return this.setState({error:'Выберите PNG, JPEG или WebP до 2 МБ.'});
  this.setState({busy:true,error:''});try{
   const b64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Невозможно прочитать файл'));reader.readAsDataURL(file)});
   const r=await wikiFetch('/api/admin/item-image/'+this.props.item.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:b64})}).then(errorMessage);
   this.setState({url:r.url,busy:false});
  }catch(e){this.setState({error:e.message,busy:false});}}
 render(){const s=this.state;return h('section',{className:'wiki-item-art'+(this.props.size==='large'?' large':'')},
  s.url?h('img',{src:wikiUrl(s.url),alt:'Изображение: '+this.props.item.name,onError:()=>this.setState({url:null})}):h('div',{className:'wiki-item-no-art'},h('span',{},'◈'),h('small',{},'ИЗОБРАЖЕНИЕ НЕ ЗАГРУЖЕНО')),
  h('div',{className:'wiki-item-art-info'},h('strong',{},this.props.item.name),h('small',{},'GUID · '+this.props.item.id),this.props.admin&&h('label',{className:'extra-outline'},s.busy?'Загрузка…':'Загрузить изображение',h('input',{type:'file',accept:'.png,.jpg,.jpeg,.webp',disabled:s.busy,style:{display:'none'},onChange:e=>{this.upload(e.target.files?.[0]);e.target.value=''}}))),s.error&&h('p',{className:'extra-alert'},s.error),h('p',{className:'extra-source'},'Иконки из игрового архива подбираются по коду предмета; редактор может заменить изображение своей загрузкой.'),this.props.item.iconMatch&&h('span',{className:'wiki-item-image-source'},this.props.item.iconMatch==='game-icon'?'Оригинальная игровая иконка KCD2':this.props.item.iconMatch==='placeholder'?'Игровая иконка не найдена — показана заглушка':this.props.item.iconMatch==='exact'?'Иконка соответствует внутреннему коду':this.props.item.iconMatch==='normalized'?'Иконка по нормализованному коду':'Общая иконка варианта предмета'));
 }
}
window.WikiExtraAnimations=Animations;
window.WikiExtraMap=MapPage;
window.WikiExtraItemArt=ItemArt;
})();
