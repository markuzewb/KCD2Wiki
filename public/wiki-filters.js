/* KCD2RP Wiki — универсальная боковая панель фильтров (единый стиль для всех каталогов).
   window.WikiFilterPanel props:
   - search: {value, onChange(v), placeholder, hidden} — поиск; hidden=true → только ярлык, без поля в панели
   - groups: [{key,title,value,onSelect(v),options:[{value,label,count,icon}],clearValue='',hint,collapsed}]
   - onReset() — сброс всех фильтров; total, unit — счётчик результатов; children — результаты. */
(function(){'use strict';
const h=React.createElement;
const fmt=n=>Number(n||0).toLocaleString('ru-RU');
const OPT_LIMIT=12;
class WikiFilterPanel extends React.Component{
 constructor(p){super(p);this.state={closed:{},drawer:false,optQ:{},more:{}};}
 isClosed(g){const c=this.state.closed[g.key];if(c!==undefined)return c;return !!g.collapsed&&!this.isActive(g);}
 isActive(g){const cv=g.clearValue!==undefined?g.clearValue:'';return g.value!=null&&g.value!==cv;}
 toggleGroup(key,next){this.setState(s=>({closed:Object.assign({},s.closed,{[key]:next})}));}
 group(g){
  const closed=this.isClosed(g);
  const options=g.options||[];
  const rawQ=this.state.optQ[g.key]||'';
  const q=rawQ.trim().toLocaleLowerCase('ru');
  const withSearch=options.length>OPT_LIMIT;
  let shown=q?options.filter(o=>String(o.label).toLocaleLowerCase('ru').includes(q)):options;
  const expanded=!!this.state.more[g.key];
  let hidden=0;
  if(!q&&!expanded&&shown.length>OPT_LIMIT+2){hidden=shown.length-OPT_LIMIT;shown=shown.slice(0,OPT_LIMIT);}
  const cv=g.clearValue!==undefined?g.clearValue:'';
  return h('section',{key:g.key,className:'wf-group'+(closed?' wf-closed':'')},
   h('button',{type:'button',className:'wf-group-head','aria-expanded':!closed,onClick:()=>this.toggleGroup(g.key,!closed)},
    h('span',{},g.title),
    this.isActive(g)?h('i',{className:'wf-group-dot',title:'Фильтр применён'}):null,
    h('span',{className:'wf-chevron'},closed?'▸':'▾')),
   closed?null:h('div',{className:'wf-group-body'},
    options.length?[
     withSearch?h('input',{key:'s',className:'wf-opt-search',value:rawQ,placeholder:'Найти в списке…','aria-label':'Поиск по фильтру «'+g.title+'»',onChange:e=>this.setState(s=>({optQ:Object.assign({},s.optQ,{[g.key]:e.target.value})}))}):null,
     ...shown.map(o=>h('button',{key:String(o.value),type:'button',className:'wf-opt'+(g.value===o.value?' active':''),onClick:()=>g.onSelect(g.value===o.value?cv:o.value)},
      h('span',{className:'wf-opt-label'},(o.icon?o.icon+' ':'')+o.label),
      o.count!=null?h('span',{className:'wf-opt-count'},fmt(o.count)):null)),
     hidden?h('button',{key:'m',type:'button',className:'wf-more',onClick:()=>this.setState(s=>({more:Object.assign({},s.more,{[g.key]:true})}))},'Показать ещё '+fmt(hidden)):null,
     q&&!shown.length?h('p',{key:'e',className:'wf-hint'},'Ничего не найдено'):null
    ]:h('p',{className:'wf-hint'},g.hint||'Нет вариантов')));
 }
 render(){
  const p=this.props;
  const groups=(p.groups||[]).filter(Boolean);
  const pills=[];
  if(p.search&&p.search.value&&p.search.value.trim())pills.push({label:'Поиск: «'+p.search.value.trim()+'»',clear:()=>p.search.onChange('')});
  for(const g of groups){
   if(!this.isActive(g))continue;
   const o=(g.options||[]).find(x=>x.value===g.value);
   const cv=g.clearValue!==undefined?g.clearValue:'';
   pills.push({label:g.title+': '+(o?o.label:g.value),clear:()=>g.onSelect(cv)});
  }
  const n=pills.length;
  const reset=()=>{this.setState({optQ:{},more:{}});if(p.onReset)p.onReset();};
  const side=h('aside',{className:'wf-side','aria-label':'Фильтры'},
   h('div',{className:'wf-side-head'},
    h('span',{},'Фильтры'+(n?' · '+n:'')),
    n?h('button',{type:'button',className:'wf-reset',onClick:reset},'Сбросить всё'):null,
    h('button',{type:'button',className:'wf-close',onClick:()=>this.setState({drawer:false}),'aria-label':'Закрыть фильтры'},'×')),
   p.search&&!p.search.hidden?h('div',{className:'wf-search'},
    h('input',{value:p.search.value,onChange:e=>p.search.onChange(e.target.value),placeholder:p.search.placeholder||'Поиск…','aria-label':p.search.placeholder||'Поиск'}),
    p.search.value?h('button',{type:'button',onClick:()=>p.search.onChange(''),'aria-label':'Очистить поиск'},'×'):null):null,
   groups.map(g=>this.group(g)),
   h('button',{type:'button',className:'wf-apply',onClick:()=>this.setState({drawer:false})},'Показать результаты'+(p.total!=null?' · '+fmt(p.total):'')));
  return h('div',{className:'wf-layout'+(this.state.drawer?' wf-open':'')},
   side,
   this.state.drawer?h('div',{className:'wf-backdrop',onClick:()=>this.setState({drawer:false})}):null,
   h('div',{className:'wf-main'},
    h('div',{className:'wf-topbar'},
     h('button',{type:'button',className:'wf-mobile-toggle',onClick:()=>this.setState({drawer:true})},'☰ Фильтры'+(n?' · '+n:'')),
     p.total!=null?h('span',{className:'wf-count'},'Найдено: ',h('b',{},fmt(p.total)),p.unit?' · '+p.unit:''):null),
    pills.length?h('div',{className:'wf-pills'},
     pills.map((x,i)=>h('button',{key:i,type:'button',className:'wf-pill',title:'Снять фильтр',onClick:x.clear},x.label,h('i',{},'×'))),
     pills.length>1?h('button',{type:'button',className:'wf-pill wf-pill-reset',onClick:reset},'Сбросить всё'):null):null,
    p.children));
 }
}
window.WikiFilterPanel=WikiFilterPanel;
})();
