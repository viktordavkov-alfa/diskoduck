import {SUPPORT,PRODUCTS,checkoutURL} from './commerce.js?v=8';
import {writeChalk} from './chalk.js?v=8';
import {initKeywordNudges} from './nudges.js?v=8';

export function initStory(){
  const $=id=>document.getElementById(id);
  const opener=$('story-open'),story=$('story-lines'),copy=$('story-copy'),fund=$('fund-view'),shop=$('shop-view'),panels=$('help-panels');
  const checkout=$('fund-checkout'),caption=$('fund-caption');
  const radios=[...document.querySelectorAll('input[name="support"]')];
  let selected='round',hasWritten=false,lastHelpButton=null;
  function syncCheckout(){
    const option=SUPPORT[selected],url=checkoutURL(option.checkoutUrl);
    caption.textContent=option.caption;checkout.disabled=!url;
    checkout.textContent=url?`send $${option.amount} to the duck ↗`:'checkout opens soon';
  }
  function setExpanded(expanded){
    story.hidden=!expanded;opener.setAttribute('aria-expanded',String(expanded));
    $('story-toggle-mark').textContent=expanded?'−':'+';
    document.body.classList.toggle('story-expanded',expanded);
    if(expanded&&!hasWritten){
      const duration=writeChalk(copy.querySelectorAll('[data-handwrite]'),{start:.06,speed:.018});
      setTimeout(()=>copy.classList.add('is-written'),duration*1000);
      hasWritten=true;
    }
  }
  function syncExpandedButtons(){
    for(const button of document.querySelectorAll('[data-help]')){
      const view=button.dataset.help==='fund'?fund:shop;
      const selectedPurpose=button.dataset.purpose==='disco'?'ticket':'round';
      button.setAttribute('aria-expanded',String(!view.hidden&&(view===shop||selected===selectedPurpose)));
    }
  }
  function closePanels({focus=false}={}){
    fund.hidden=true;shop.hidden=true;panels.hidden=true;
    document.querySelector('.duck-tab').classList.remove('help-open');syncExpandedButtons();
    if(focus)lastHelpButton?.focus({preventScroll:true});
  }
  function revealPanel(name,button){
    lastHelpButton=button||lastHelpButton;
    panels.hidden=false;fund.hidden=name!=='fund';shop.hidden=name!=='shop';
    document.querySelector('.duck-tab').classList.add('help-open');syncExpandedButtons();
    $(`${name}-title`).focus({preventScroll:true});
  }
  function openFund(category='drinks',button){
    selected=category==='disco'?'ticket':'round';
    $('fund-title').textContent=category==='disco'?'get him through the door.':'a shot of confidence.';
    for(const radio of radios)radio.checked=radio.value===selected;
    syncCheckout();revealPanel('fund',button);
  }
  opener.addEventListener('click',()=>setExpanded(story.hidden));
  for(const button of document.querySelectorAll('[data-help="fund"]'))button.addEventListener('click',()=>openFund(button.dataset.purpose,button));
  for(const button of document.querySelectorAll('[data-help="shop"]'))button.addEventListener('click',()=>revealPanel('shop',button));
  $('help-close').addEventListener('click',()=>closePanels({focus:true}));
  panels.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePanels({focus:true});}});
  for(const radio of radios)radio.addEventListener('change',()=>{
    if(!radio.checked||!Object.hasOwn(SUPPORT,radio.value))return;
    selected=radio.value;syncCheckout();syncExpandedButtons();
  });
  checkout.addEventListener('click',()=>{const url=checkoutURL(SUPPORT[selected].checkoutUrl);if(url)window.location.assign(url);});
  for(const button of document.querySelectorAll('[data-product]')){
    const url=checkoutURL(PRODUCTS[button.dataset.product]?.checkoutUrl);
    button.disabled=!url;button.textContent=url?'view & buy ↗':'coming soon';
    if(url)button.addEventListener('click',()=>window.location.assign(url));
  }
  initKeywordNudges(copy,{beforeNudge:()=>{if(!panels.hidden)closePanels();}});
  syncCheckout();syncExpandedButtons();
  return {openFund,setExpanded};
}
