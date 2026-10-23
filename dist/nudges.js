// Words point at their matching action; they never activate checkout or merch.
export function initKeywordNudges(root,{getTarget=id=>document.getElementById(id),beforeNudge=()=>{},reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches}={}){
  const animations=new Map();let active=null,reset;
  const keyword=event=>{const word=event.target.closest?.('[data-nudge]');return word&&root.contains(word)?word:null;};
  function clear(){clearTimeout(reset);active?.classList.remove('is-linked');active=null;}
  function nudge(word,transient=false){
    const target=getTarget(word.dataset.nudge);if(!target)return;
    beforeNudge();clear();active=target;target.classList.add('is-linked');
    animations.get(target)?.cancel();
    if(!reduced()&&typeof target.animate==='function'){
      const animation=target.animate([
        {transform:'translate3d(0,0,0) rotate(0deg)'},
        {transform:'translate3d(-4px,-1px,0) rotate(-.7deg)',offset:.28},
        {transform:'translate3d(2px,0,0) rotate(.35deg)',offset:.58},
        {transform:'translate3d(0,0,0) rotate(0deg)'}
      ],{duration:540,easing:'cubic-bezier(.22,.61,.36,1)'});
      animations.set(target,animation);
    }
    if(transient)reset=setTimeout(clear,950);
  }
  root.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const word=keyword(event);if(word&&!word.contains(event.relatedTarget))nudge(word);
  });
  root.addEventListener('pointerout',event=>{const word=keyword(event);if(word&&!word.contains(event.relatedTarget))clear();});
  root.addEventListener('focusin',event=>{const word=keyword(event);if(word)nudge(word);});
  root.addEventListener('focusout',clear);
  root.addEventListener('click',event=>{const word=keyword(event);if(word){event.preventDefault();nudge(word,true);}});
  return {clear};
}
