import {STROKES,REVEAL_AT,REVEAL_DURATION,clamp,handProgress,buildPaceMap,pacedDistance,liftPoint} from './intro-motion.js?v=1';

const cover=document.getElementById('duck-intro');
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frameId=0,done=false,revealing=false,exitTimer=0;
const release=()=>{
  if(done)return;
  done=true;cancelAnimationFrame(frameId);clearTimeout(exitTimer);
  clearTimeout(window.__duckIntroWatchdog);
  root.classList.remove('intro-pending','intro-leaving');
  document.getElementById('dancefloor')?.removeAttribute('inert');
  cover?.remove();
  removeEventListener('keydown',skip);
  reduced.removeEventListener('change',onReducedMotion);
  document.dispatchEvent(new Event('duck:intro-end'));
};
function skip(event){if(event.key==='Escape'){event.preventDefault();release();}}
function onReducedMotion(event){if(event.matches)release();}

try{
  if(!cover||!root.classList.contains('intro-pending'))release();
  else{
    document.getElementById('dancefloor').setAttribute('inert','');
    cover.hidden=false;
    const paths=STROKES.map(stroke=>{
      const element=cover.querySelector(`[data-stroke="${stroke.id}"]`),length=element.getTotalLength();
      const points=[],count=Math.max(12,Math.ceil(length/2));
      for(let i=0;i<=count;i++){const distance=length*i/count,p=element.getPointAtLength(distance);points.push({x:p.x,y:p.y,distance});}
      element.style.strokeDasharray=`${length} ${length}`;
      element.style.strokeDashoffset=String(length);
      return {...stroke,element,length,map:buildPaceMap(points),first:points[0],last:points.at(-1)};
    });
    const sticks={ivory:cover.querySelector('[data-stick="ivory"]'),coral:cover.querySelector('[data-stick="coral"]')};
    const rest={ivory:{x:493,y:403},coral:{x:503,y:428}};
    const caption=cover.querySelector('.intro-caption');
    const dust=cover.querySelector('.intro-dust'),particles=[];
    let lastDustAt=-100;

    function drawLines(time){
      for(const s of paths){
        if(time<s.start)continue;
        const progress=handProgress((time-s.start)/s.duration);
        const distance=pacedDistance(s.map,progress);
        s.element.style.visibility='visible';
        s.element.style.strokeDashoffset=String(Math.max(0,s.length-distance));
      }
    }

    function chalkAt(color,time){
      const list=paths.filter(s=>s.chalk===color),home=rest[color];
      let previous=null;
      for(const s of list){
        if(time<s.start){
          const start=previous?previous.start+previous.duration:color==='ivory'?0:1680;
          if(time<start)return {point:home,angle:28,lift:0};
          const from=previous?previous.last:home;
          const t=clamp((time-start)/(s.start-start));
          return {point:liftPoint(from,s.first,t),angle:28-8*Math.sin(Math.PI*t),lift:Math.sin(Math.PI*t)};
        }
        if(time<=s.start+s.duration){
          const progress=handProgress((time-s.start)/s.duration),distance=pacedDistance(s.map,progress);
          const point=s.element.getPointAtLength(distance),next=s.element.getPointAtLength(Math.min(s.length,distance+2));
          const tangent=Math.atan2(next.y-point.y,next.x-point.x);
          return {point,angle:28+Math.sin(tangent)*8+Math.sin(time*.018)*1.2,lift:0,drawing:true,color};
        }
        previous=s;
      }
      const end=previous.start+previous.duration,t=clamp((time-end)/140);
      return {point:liftPoint(previous.last,home,t),angle:28,lift:Math.sin(Math.PI*t)};
    }

    function updateDust(time,active){
      if(active?.drawing&&time-lastDustAt>28&&particles.length<24){
        const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
        const seed=Math.sin(time*8.31)*43758.5453,fraction=seed-Math.floor(seed);
        dot.setAttribute('r',String(.65+fraction*.75));
        dot.setAttribute('fill',active.color==='coral'?'#ffae85':'#fff3d6');
        dust.append(dot);
        particles.push({dot,born:time,x:active.point.x,y:active.point.y,vx:(fraction-.5)*17});
        lastDustAt=time;
      }
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i],age=(time-p.born)/1000;
        if(age>.28){p.dot.remove();particles.splice(i,1);continue;}
        p.dot.setAttribute('cx',String(p.x+p.vx*age));
        p.dot.setAttribute('cy',String(p.y+28*age*age));
        p.dot.setAttribute('opacity',String((1-age/.28)*.58));
      }
    }

    function paint(time){
      drawLines(time);
      let active=null;
      for(const color of ['ivory','coral']){
        const state=chalkAt(color,time),{point,angle,lift}=state;
        sticks[color].setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${1+lift*.055})`);
        if(state.drawing)active=state;
      }
      updateDust(time,active);
      if(time>=2490)caption.classList.add('is-visible');
    }

    if(reduced.matches){
      drawLines(REVEAL_AT);caption.classList.add('is-visible');
      exitTimer=setTimeout(release,100);
    }else{
      addEventListener('keydown',skip);
      reduced.addEventListener('change',onReducedMotion);
      const started=performance.now();
      function frame(now){
        if(done||!cover.isConnected){release();return;}
        const time=now-started;
        paint(time);
        if(time>=REVEAL_AT&&!revealing){
          revealing=true;root.classList.add('intro-leaving');
          // A deadline also completes the reveal when an inactive tab stops rAF.
          exitTimer=setTimeout(release,REVEAL_DURATION+30);
        }
        if(time>=REVEAL_AT+REVEAL_DURATION){release();return;}
        frameId=requestAnimationFrame(frame);
      }
      frameId=requestAnimationFrame(frame);
    }
  }
}catch(error){
  console.warn('Skipping the chalk introduction',error);
  release();
}
