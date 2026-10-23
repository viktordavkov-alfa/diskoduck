export const NIGHT_BUDGET=Object.freeze([
  {key:'drinks',label:'drinks',amount:30,color:'#ffffff',note:'Beer, shots & cocktails. In that order.'},
  {key:'disco',label:'disco',amount:12,color:'#b9dbdd',note:'The bouncer does not accept good vibes.'},
  {key:'food',label:'food',amount:3,color:'#f2b18a',note:'Something small. On the way home.'}
]);
export const TOTAL_BUDGET=NIGHT_BUDGET.reduce((sum,item)=>sum+item.amount,0);

// A deliberately hand-drawn arc; angular proportions still match each budget.
export function chalkArc(start,end,radius=71){
  const steps=Math.max(8,Math.ceil((end-start)/3));
  const points=Array.from({length:steps+1},(_,i)=>{
    const degree=start+(end-start)*i/steps,angle=degree*Math.PI/180;
    const r=radius+Math.sin(angle*7+.2)*.65+Math.cos(angle*3)*.35;
    return `${i?'L':'M'}${(100+Math.cos(angle)*r).toFixed(2)} ${(100+Math.sin(angle)*r).toFixed(2)}`;
  });
  return points.join(' ');
}
export function initBudget(onFund){
  const ns='http://www.w3.org/2000/svg',rings=document.getElementById('budget-rings');
  const amount=document.getElementById('chart-amount'),label=document.getElementById('chart-label'),note=document.getElementById('budget-note');
  const buttons=[...document.querySelectorAll('[data-budget]')];
  const segments=new Map();let selected=null,start=-90;
  function show(key){
    const item=NIGHT_BUDGET.find(item=>item.key===key);
    amount.textContent=`$${item?item.amount:TOTAL_BUDGET}`;label.textContent=item?item.label:'tonight';
    note.textContent=item?item.note:'A very ambitious $45.';
    for(const [id,path]of segments){path.classList.toggle('is-muted',!!key&&id!==key);path.classList.toggle('is-highlighted',id===key);}
    for(const button of buttons){button.classList.toggle('is-muted',!!key&&button.dataset.budget!==key);button.setAttribute('aria-pressed',String(button.dataset.budget===selected));}
  }
  function choose(key){selected=selected===key?null:key;show(selected);}
  for(const [index,item]of NIGHT_BUDGET.entries()){
    const sweep=item.amount/TOTAL_BUDGET*360,d=chalkArc(start+3,start+sweep-3);start+=sweep;
    const group=document.createElementNS(ns,'g');group.dataset.category=item.key;
    for(const underpaint of [true,false]){
      const line=document.createElementNS(ns,'path');line.setAttribute('d',d);line.setAttribute('pathLength','1');line.setAttribute('stroke',item.color);line.setAttribute('class',`budget-ring${underpaint?' underpaint':''}`);line.style.setProperty('--ring-delay',`${.65+index*.2}s`);group.append(line);if(!underpaint)segments.set(item.key,line);
    }
    const hit=document.createElementNS(ns,'path');hit.setAttribute('d',d);hit.setAttribute('class','budget-hit');
    hit.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')show(item.key);});
    hit.addEventListener('pointerleave',()=>show(selected));hit.addEventListener('click',()=>choose(item.key));
    group.append(hit);rings.append(group);
  }
  for(const button of buttons){
    const key=button.dataset.budget;
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')show(key);});
    button.addEventListener('pointerleave',()=>show(selected));button.addEventListener('focus',()=>show(key));
    button.addEventListener('blur',()=>show(selected));button.addEventListener('click',()=>choose(key));
  }
  document.getElementById('fund-night').addEventListener('click',()=>onFund(selected));
  show(null);
}
