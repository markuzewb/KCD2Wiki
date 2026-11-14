/* KCD2RP Wiki v0.4 – visual browser of owner's KCD2 icon archive. */
(function(){'use strict';
const WIKI_BASE=String(window.KCD2RP_WIKI_BASE||'').replace(/\/+$/,'');
const wikiUrl=u=>typeof u==='string'&&u.startsWith('/')&&!u.startsWith('//')?WIKI_BASE+u:u;
const wikiFetch=(u,options)=>window.KCD2RPStaticAPI?window.KCD2RPStaticAPI.fetch(u,options):fetch(wikiUrl(u),options);
const h=React.createElement;
const go=target=>window.KCD2RPNavigate?window.KCD2RPNavigate(target):(location.href=wikiUrl(target));
const counts=n=>Number(n||0).toLocaleString('ru-RU');
const headings={items:'Предметы',perks:'Перки',buffs:'Эффекты',map:'Карта',rpg:'Характеристики',combos:'Комбинации ударов',skillchecks:'Проверки навыков',fancy:'Оформление заданий',reputation:'Репутация',codex:'Энциклопедия',rewards:'Награды',tutorials:'Обучение',questlog:'Журнал заданий',statistics:'Статистика',dlc:'Дополнения',randomevents:'Случайные события',alchemybase:'Алхимия',recipes:'Рецепты'};
const getJSON=async url=>{const resp=await wikiFetch(url);const body=await resp.json();if(!resp.ok)throw Error(body.error||'Ошибка загрузки');return body};
function copyValue(value){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value).catch(()=>{});
 const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.top='-9999px';document.body.append(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve();
}
class IconGallery extends React.Component{
 constructor(props){super(props);this.state={q:'',category:'items',page:1,rows:[],total:0,pages:1,meta:null,selected:null,loading:true,error:'',copy:''};this.seq=0;this.timer=null;}
 componentDidMount(){wikiFetch('/api/icons/meta').then(r=>r.json()).then(meta=>this.setState({meta})).catch(()=>{});this.search();}
 componentWillUnmount(){this.seq++;clearTimeout(this.timer);}
 change(k,val){this.setState({[k]:val,page:1,selected:null},()=>{clearTimeout(this.timer);this.timer=setTimeout(()=>this.search(),k==='q'?180:0);});}
 page(n){this.setState({page:n,selected:null},()=>this.search());const scroll=document.querySelector('.scroll-area');if(scroll)scroll.scrollTo({top:0,behavior:'smooth'});}
 async search(){const request=++this.seq,st=this.state;this.setState({loading:true,error:''});
  try{const params=new URLSearchParams({page:String(st.page),limit:'48',q:st.q});if(st.category)params.set('category',st.category);
   const data=await getJSON('/api/icons?'+params);if(this.seq!==request)return;
   this.setState({loading:false,rows:data.rows||[],total:data.total||0,pages:data.pages||1});
  }catch(e){if(this.seq===request)this.setState({loading:false,error:e.message})}
 }
 copy(value){copyValue(value);this.setState({copy:'Скопировано: '+value});}
 render(){const s=this.state,meta=s.meta,cats=meta?.categories||{};
  const chosen=s.selected;
  return h('div',{className:'page wiki-icons-page'},
   h('div',{className:'game-title'},h('span',{className:'page-overline'},'БИБЛИОТЕКА ИГРОВОЙ ГРАФИКИ'),h('h1',{},'Иконки Богемии'),
     h('p',{},'Изображения из архива KCD2. Для предметов автоматическая привязка выполняется только по проверенному внутреннему названию — без случайной подстановки.')),
   h('div',{className:'icon-kpis'},
    h('div',{},h('small',{},'ИЗОБРАЖЕНИЙ В БИБЛИОТЕКЕ'),h('strong',{},counts(meta?.total))),
    h('div',{},h('small',{},'ПРИВЯЗАНО К ПРЕДМЕТАМ'),h('strong',{},counts(meta?.matched))),
    h('div',{},h('small',{},'РАЗДЕЛОВ'),h('strong',{},counts(Object.keys(cats).length)))),
   h('div',{className:'icon-nav'},h('button',{onClick:()=>go('/game/items')},'◈ Предметы'),h('button',{onClick:()=>go('/game/recipes')},'⚒ Рецепты'),h('button',{className:'current'},'▦ Иконки')),
   h('div',{className:'icon-filter-panel'},
     h('label',{},'Поиск по внутреннему названию',h('input',{value:s.q,onChange:e=>this.change('q',e.target.value),placeholder:'Например: sword, shield, potion, horse, perk…','aria-label':'Поиск иконок'})),
     h('label',{},'Раздел',h('select',{value:s.category,onChange:e=>this.change('category',e.target.value)},
       h('option',{value:''},'Все разделы'),Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([id,count])=>h('option',{value:id,key:id},(headings[id]||id)+' · '+counts(count))))),
     h('div',{className:'icon-results-total'},h('small',{},'ПОИСК'),h('strong',{},counts(s.total)))) ,
   s.error&&h('p',{className:'extra-alert'},s.error),
   s.loading&&!s.rows.length?h('div',{className:'icon-empty'},'Загрузка иконок…'):
    s.rows.length?h('div',{className:'icon-gallery-grid'},s.rows.map(icon=>h('button',{type:'button',key:icon.path,className:'icon-gallery-card',onClick:()=>this.setState({selected:icon})},
      h('span',{className:'icon-gallery-art'},h('img',{src:wikiUrl(icon.path),alt:'',loading:'lazy'})),
      h('span',{className:'icon-gallery-label'},icon.id),
      h('span',{className:'icon-gallery-meta'},headings[icon.category]||icon.category)))):
      h('div',{className:'icon-empty'},'Таких иконок нет. Попробуйте другой запрос.'),
   h('div',{className:'icon-pager'},h('button',{disabled:s.page<=1,onClick:()=>this.page(s.page-1)},'← Назад'),h('span',{},'Страница '+s.page+' из '+s.pages+' · '+counts(s.total)+' изображений'),h('button',{disabled:s.page>=s.pages,onClick:()=>this.page(s.page+1)},'Далее →')),
   h('p',{className:'extra-source'},'Источник: предоставленный архив icons.rar. Названия изображений являются внутренними кодами игры, а не гарантированными названиями предметов. Игровые файлы не изменяются.'),
   chosen&&h('div',{className:'icon-preview-backdrop',onClick:()=>this.setState({selected:null})},
     h('section',{className:'icon-preview',role:'dialog','aria-modal':'true','aria-label':'Просмотр иконки',onClick:e=>e.stopPropagation()},
      h('div',{className:'icon-preview-top'},h('strong',{},'Игровая иконка'),h('button',{type:'button',onClick:()=>this.setState({selected:null}),'aria-label':'Закрыть'},'×')),
      h('div',{className:'icon-preview-image'},h('img',{src:wikiUrl(chosen.path),alt:'Игровая иконка '+chosen.id})),
      h('small',{},(headings[chosen.category]||chosen.category)+' · '+chosen.width+'×'+chosen.height),
      h('h2',{},chosen.id),h('code',{},chosen.path),
      h('div',{className:'icon-preview-actions'},h('button',{onClick:()=>this.copy(chosen.id)},'Копировать ID'),h('button',{onClick:()=>this.copy(chosen.path)},'Копировать путь')),
      s.copy&&h('p',{className:'icon-copy-ok'},s.copy))));
 }
}
window.WikiIconsPage=IconGallery;
})();
