import * as THREE from './vendor/three.module.js';
import {DuckMusic,TRACKS} from './music.js?v=8';
import {PALETTES,layout,advanceSpring,makePose,pickUV,vertexShader,fragmentShader,paperVertexShader,paperFragmentShader} from './puppet.js?v=8';
import {initStory} from './story.js?v=8';
import {initChalk} from './chalk.js?v=8';
import {initPlayer} from './player.js?v=8';
import {initParty,shotEffects} from './party.js?v=8';

const $=id=>document.getElementById(id);
const stage=$('stage'),fallback=$('duck-fallback'),front=$('duck-front'),announcement=$('announcement');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const music=new DuckMusic();
music.select(TRACKS.findIndex(track=>track.id==='club-diver'),{autoplay:false});
const state={mode:'disco',started:false,paused:false,facing:0,shots:0,tipsy:0,energy:reduced.matches ? .08 : .8,beat:0,peck:-10,last:performance.now(),drag:null,hover:{x:0,y:0},blinkAt:performance.now()/1000+3.2,blinkStart:-10,pose:makePose({energy:.5}),spring:{x:0,y:0,vx:0,vy:0}};
let renderer,camera,scene,artwork,uniforms,paper,paperUniforms,pixels,frontPixels,frameLayout,targetLayout,width=innerWidth,height=innerHeight,ready=false;

function placeArtwork(){
  const p=frameLayout;
  for(const image of [fallback,front])Object.assign(image.style,{width:`${p.width}px`,height:`${p.height}px`,left:`${width/2+p.x-p.width/2}px`,top:`${height/2-p.y-p.height/2}px`});
  if(artwork){artwork.position.set(p.x,p.y,0);uniforms.uSize.value.set(p.width,p.height);}
}
function resize(){
  width=stage.clientWidth;height=stage.clientHeight;
  targetLayout=layout(width,height,document.body.classList.contains('story-expanded'));
  frameLayout={...targetLayout};placeArtwork();
  if(!renderer||!artwork)return;
  renderer.setSize(width,height);
  camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
  paper.scale.set(width,height,1);paperUniforms.uViewport.value.set(width,height);
}

function announce(text){announcement.textContent=text;}
async function play(){if(music.status==='loading')return;music.setMuted(false);await music.start();}
function stop(){music.stop();state.drag=null;state.hover={x:0,y:0};stage.classList.remove('dragging');announce('Music stopped. He is looking right at you.');}
function toggle(){if(music.playing||music.status==='loading')music.pause();else play();}
function changeMood(mode){
  state.mode=mode;
  document.documentElement.style.setProperty('--backdrop',PALETTES[mode]);
  document.querySelector('meta[name="theme-color"]').content=PALETTES[mode];
  if(paperUniforms)paperUniforms.targetTint=tintFor(PALETTES[mode]);
  announce(`${mode==='slow'?'Slow dance':mode==='techno'?'Techno':'Disco'} groove`);
}
function clickDuck(){
  state.peck=performance.now()/1000;
  if(!state.started||state.paused){play();return;}
  music.next();
}
function pointOnDuck(x,y){
  const p=frameLayout;
  let uv;
  if(ready){uv=pickUV(x-width/2-p.x,height/2-y-p.y,p,state.pose);}
  else{const naturalHeight=p.width/1.5;uv={u:(x-width/2-p.x)/p.width+.5,v:(height/2-y-p.y+p.height/2)/naturalHeight};}
  if(!uv||uv.u<0||uv.u>=1||uv.v<=0||uv.v>1)return false;
  const mask=state.facing>.5&&frontPixels?frontPixels:pixels;
  if(!mask)return uv.u>.14&&uv.u<.79;
  const px=Math.floor(uv.u*mask.width),py=Math.min(mask.height-1,Math.floor((1-uv.v)*mask.height));
  return mask.data[(py*mask.width+px)*4+3]>100;
}
function tintFor(hex){
  const n=parseInt(hex.slice(1),16);
  return new THREE.Vector3(((n>>16)&255)/57,((n>>8)&255)/91,(n&255)/146);
}
function makeArtwork(image,reference,frontImage){
  try{
    const hitCanvas=document.createElement('canvas');hitCanvas.width=image.naturalWidth;hitCanvas.height=image.naturalHeight;
    const ctx=hitCanvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);pixels=ctx.getImageData(0,0,hitCanvas.width,hitCanvas.height);
    ctx.clearRect(0,0,hitCanvas.width,hitCanvas.height);ctx.drawImage(frontImage,0,0,hitCanvas.width,hitCanvas.height);frontPixels=ctx.getImageData(0,0,hitCanvas.width,hitCanvas.height);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x395b92,1);stage.appendChild(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,1000);camera.position.z=400;
    const texture=new THREE.Texture(image),referenceTexture=new THREE.Texture(reference),frontTexture=new THREE.Texture(frontImage);
    for(const tex of [texture,referenceTexture,frontTexture]){tex.colorSpace=THREE.NoColorSpace;tex.needsUpdate=true;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
    paperUniforms={uReference:{value:referenceTexture},uViewport:{value:new THREE.Vector2(width,height)},uTint:{value:tintFor(PALETTES[state.mode])},targetTint:tintFor(PALETTES[state.mode])};
    paper=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({uniforms:paperUniforms,vertexShader:paperVertexShader,fragmentShader:paperFragmentShader,depthWrite:false,toneMapped:false}));
    paper.position.z=-2;paper.frustumCulled=false;scene.add(paper);
    uniforms={uArtwork:{value:texture},uReference:{value:referenceTexture},uFront:{value:frontTexture},uFacing:{value:0},uTipsy:{value:0},uTime:{value:0},uBend:{value:0},uLift:{value:0},uTilt:{value:0},uRipple:{value:0},uBlink:{value:0},uSize:{value:new THREE.Vector2()}};
    artwork=new THREE.Mesh(new THREE.PlaneGeometry(1,1,64,96),new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false}));
    artwork.frustumCulled=false;scene.add(artwork);resize();renderer.render(scene,camera);stage.classList.add('ready');ready=true;
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;stage.classList.remove('ready');});
    renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  }catch(error){console.warn('Using the illustrated fallback',error);stage.classList.remove('ready');ready=false;}
}

function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-state.last)/1000,.04);state.last=now;
  if(document.hidden)return;
  if(targetLayout){
    const pace=reduced.matches?1:1-Math.exp(-dt*4.5);let moving=false;
    for(const key of ['x','y','width','height'])if(Math.abs(targetLayout[key]-frameLayout[key])>.03){frameLayout[key]+=(targetLayout[key]-frameLayout[key])*pace;moving=true;}
    if(moving)placeArtwork();
  }
  const time=now/1000,effects=shotEffects(state.shots),targetEnergy=state.paused?0:reduced.matches ? .04 : (state.started?1:.5)*effects.energy;
  state.energy+=(targetEnergy-state.energy)*(1-Math.exp(-dt*4));
  state.facing+=((state.paused?1:0)-state.facing)*(reduced.matches?1:1-Math.exp(-dt*7));
  state.tipsy+=(effects.tipsy-state.tipsy)*(1-Math.exp(-dt*3));
  if(music.playing)state.beat=music.getBeat();else if(!state.paused)state.beat+=dt*music.track.bpm/60;
  let targetX=state.paused?0:state.hover.x*.011,targetY=state.paused?0:state.hover.y*.12;
  if(state.drag?.hit&&!state.paused){targetX=Math.max(-.17,Math.min(.17,(state.drag.x-state.drag.startX)/height));targetY=Math.max(-.8,Math.min(.8,(state.drag.startY-state.drag.y)/height));}
  if(reduced.matches){targetX*=.25;targetY*=.25;}
  advanceSpring(state.spring,targetX,targetY,dt);
  const peckElapsed=time-state.peck,peck=peckElapsed>=0&&peckElapsed<.6?Math.sin(peckElapsed/.6*Math.PI):0;
  const wobble=reduced.matches||state.paused?0:Math.sin(time*2.7)*effects.wobble;
  state.pose=makePose({time:reduced.matches?0:time,beat:state.beat,energy:state.energy,bend:state.spring.x+wobble,lift:state.spring.y,tilt:state.spring.x*.22+wobble*.7,peck:state.paused?0:peck,mode:state.mode});
  if(time>state.blinkAt){state.blinkStart=time;state.blinkAt=time+3.5+Math.random()*3;}
  const blinkElapsed=time-state.blinkStart;
  const blink=blinkElapsed>=0&&blinkElapsed<.23?Math.pow(Math.sin(blinkElapsed/.23*Math.PI),1.4):0;
  if(ready){
    uniforms.uTime.value=state.pose.time;uniforms.uBend.value=state.pose.bend;uniforms.uLift.value=state.pose.lift;
    uniforms.uTilt.value=state.pose.tilt;uniforms.uRipple.value=state.pose.ripple;uniforms.uBlink.value=blink;uniforms.uFacing.value=state.facing;uniforms.uTipsy.value=state.tipsy;
    paperUniforms.uTint.value.lerp(paperUniforms.targetTint,1-Math.exp(-dt*1.8));
    renderer.render(scene,camera);
  }else{fallback.style.transform=`translateX(${state.spring.x*height}px) rotate(${Math.sin(state.beat*Math.PI)*1.8*state.energy+state.spring.x*30}deg)`;fallback.style.opacity=String(1-state.facing);front.style.opacity=String(state.facing);}
}

stage.addEventListener('pointerdown',event=>{
  if(event.button!==0||state.drag)return;
  state.drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,hit:pointOnDuck(event.clientX,event.clientY),moved:false};
  stage.setPointerCapture(event.pointerId);if(state.drag.hit)stage.classList.add('dragging');
});
stage.addEventListener('pointermove',event=>{
  state.hover.x=event.clientX/width*2-1;state.hover.y=1-event.clientY/height*2;
  if(state.drag?.id===event.pointerId){const d=state.drag;d.moved||=Math.hypot(event.clientX-d.startX,event.clientY-d.startY)>7;if(d.hit){d.x=event.clientX;d.y=event.clientY;}}
  else stage.classList.toggle('over-duck',pointOnDuck(event.clientX,event.clientY));
});
function release(event){
  if(state.drag?.id!==event.pointerId)return;
  const drag=state.drag;state.drag=null;stage.classList.remove('dragging');
  if(!drag.moved){if(drag.hit)clickDuck();else if(!state.started)play();}
  if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
}
stage.addEventListener('pointerup',release);
for(const eventName of ['pointercancel','lostpointercapture'])stage.addEventListener(eventName,()=>{state.drag=null;stage.classList.remove('dragging');});
stage.addEventListener('pointerleave',()=>{if(!state.drag){state.hover.x=0;state.hover.y=0;stage.classList.remove('over-duck');}});
addEventListener('keydown',event=>{
  if(document.documentElement.classList.contains('intro-pending'))return;
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.target.closest('.side-left,.duck-tab,.music-player,button,input,select,textarea,a,[contenteditable="true"]'))return;
  if(event.code==='Space'){event.preventDefault();toggle();}
  else if(event.key.toLowerCase()==='s'){stop();}
  else if(event.key.toLowerCase()==='m'){music.setMuted(!music.muted);if(!state.started)play();}
  else if(['1','2','3'].includes(event.key)){music.select(Number(event.key)-1,{autoplay:true});}
  else if(event.key==='Enter'&&event.target===stage)clickDuck();
});
addEventListener('resize',resize);
addEventListener('duck:layout',()=>{targetLayout=layout(width,height,document.body.classList.contains('story-expanded'));});
document.addEventListener('visibilitychange',()=>{music.visibility(document.hidden).catch(()=>{});});
music.addEventListener('change',()=>{
  if(music.status==='playing'){state.started=true;state.paused=false;}
  else if(['paused','stopped','error'].includes(music.status))state.paused=true;
  if(state.mode!==music.track.mood)changeMood(music.track.mood);
});
initStory();initChalk();
initPlayer(music,{toggle,stop});initParty(shots=>{state.shots=shots;state.peck=performance.now()/1000;});
resize();requestAnimationFrame(frame);
const reference=new Image();reference.src='./assets/paper-reference-v3.png';
function loaded(image){return image.complete&&image.naturalWidth?Promise.resolve(image):new Promise((resolve,reject)=>{image.addEventListener('load',()=>resolve(image),{once:true});image.addEventListener('error',reject,{once:true});});}
Promise.all([loaded(fallback),loaded(reference),loaded(front)]).then(([image,ref,frontImage])=>makeArtwork(image,ref,frontImage)).catch(()=>announce('The duck image could not load. Please refresh the page.'));
