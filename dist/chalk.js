const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function writeChalk(elements,{start=0,speed=.027}={}){
  let time=start;
  for(const element of elements){
    if(reduced()||element.dataset.inkWritten)continue;
    element.dataset.inkWritten='true';
    // Animate text nodes in place so the three real keyword buttons survive.
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=node.textContent;
      const ink=document.createElement('span');ink.setAttribute('aria-hidden','true');
      for(const word of node.textContent.split(/(\s+)/)){
        if(/^\s+$/.test(word)){ink.append(document.createTextNode(word));time+=speed*.65;continue;}
        const group=document.createElement('span');group.className='ink-word';
        for(const char of word){
          const letter=document.createElement('span');letter.className='ink-char';letter.textContent=char;
          letter.style.setProperty('--delay',`${time.toFixed(3)}s`);
          letter.style.setProperty('--duration',`${Math.max(.075,speed*2.2).toFixed(3)}s`);
          group.append(letter);time+=/[.,?!]/.test(char)?speed+.075:speed;
        }
        ink.append(group);
      }
      node.replaceWith(accessible,ink);
    }
    time+=.13;
  }
  return time;
}

export async function initChalk(){
  try{await Promise.race([document.fonts.load('600 32px "Duck Chalk"'),new Promise(resolve=>setTimeout(resolve,1200))]);}catch{}
  document.querySelector('.side-left').classList.add('ink-ready');
}
