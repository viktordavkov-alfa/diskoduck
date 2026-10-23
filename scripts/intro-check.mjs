import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as motion from '../dist/intro-motion.js';

// The chalk must never travel backward over a stroke, including at corners.
const curve=Array.from({length:201},(_,i)=>({x:Math.cos(i/200*Math.PI)*100,y:Math.sin(i/200*Math.PI)*100,distance:i/200*Math.PI*100}));
const map=motion.buildPaceMap(curve);
let previous=-1;
for(let i=0;i<=1000;i++){
  const distance=motion.pacedDistance(map,motion.handProgress(i/1000));
  assert(Number.isFinite(distance)&&distance>=previous,'A chalk stroke must advance continuously.');
  previous=distance;
}
assert.equal(motion.pacedDistance(map,0),0);
assert.equal(motion.pacedDistance(map,1),curve.at(-1).distance);
assert.deepEqual(motion.liftPoint({x:10,y:20},{x:90,y:60},0),{x:10,y:20});
assert(Math.abs(motion.liftPoint({x:10,y:20},{x:90,y:60},1).y-60)<1e-9);

// Exercise the real controller with a small browser model: the important
// regression is a finished, failed or skipped intro leaving the site blocked.
const source=fs.readFileSync(new URL('../dist/intro.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const bootstrap=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup({reduced=false,broken=false}={}){
  let now=0,id=0;
  const timers=new Map(),frames=new Map(),events=new Map();
  const classes=new Set();
  const classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n)};
  const element=()=>({style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},remove(){this.removed=true;}});
  const main=element(),caption={classList:{add(){}}},sticks={ivory:element(),coral:element()},dust={append(){}};
  const paths=new Map(motion.STROKES.map((s,i)=>[s.id,{...element(),getTotalLength:()=>200+i*10,getPointAtLength:d=>({x:d,y:50+i*20})}]));
  const cover={hidden:true,isConnected:true,remove(){this.isConnected=false;},querySelector(selector){
    if(selector==='.intro-caption')return caption;
    if(selector==='.intro-dust')return dust;
    if(selector.startsWith('[data-stick'))return sticks[selector.match(/"([^"]+)"/)[1]];
    return broken?null:paths.get(selector.match(/"([^"]+)"/)[1]);
  }};
  const media={matches:reduced,addEventListener(type,fn){events.set('media:'+type,fn);},removeEventListener(type){events.delete('media:'+type);}};
  const document={documentElement:{classList},getElementById:id=>id==='dancefloor'?main:cover.isConnected?cover:null,createElementNS:()=>element(),dispatchEvent(){}};
  const context={...motion,document,performance:{now:()=>now},matchMedia:()=>media,console:{warn(){}},Event:class{},
    requestAnimationFrame(fn){const key=++id;frames.set(key,fn);return key;},cancelAnimationFrame:key=>frames.delete(key),
    setTimeout(fn,delay){const key=++id;timers.set(key,{at:now+delay,fn});return key;},clearTimeout:key=>timers.delete(key),
    addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type)};
  context.window=context;
  vm.createContext(context);vm.runInContext(bootstrap,context);
  return {main,cover,classes,frames,events,context,
    run(){vm.runInContext(source,context);},
    advance(ms,paint=true){now=ms;for(const [key,t] of [...timers])if(t.at<=now){timers.delete(key);t.fn();}if(paint){const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(now);}},
    assertReleased(){assert(!classes.has('intro-pending'));assert(!classes.has('intro-leaving'));assert(!('inert' in main.attributes));assert(!cover.isConnected);}
  };
}

const normal=setup();normal.run();
normal.advance(1200);
assert(normal.cover.isConnected&&'inert' in normal.main.attributes,'The page stays behind the drawing.');
normal.advance(2750);assert(normal.classes.has('intro-leaving'),'The completed drawing begins the reveal.');
normal.advance(3120);normal.assertReleased();assert.equal(normal.frames.size,0);

const escaped=setup();escaped.run();escaped.events.get('keydown')({key:'Escape',preventDefault(){}});escaped.assertReleased();
const reduced=setup({reduced:true});reduced.run();reduced.advance(120);reduced.assertReleased();
const changed=setup();changed.run();changed.events.get('media:change')({matches:true});changed.assertReleased();
const failed=setup({broken:true});failed.run();failed.assertReleased();
const noModule=setup();noModule.advance(5300);noModule.assertReleased();
const hidden=setup();hidden.run();hidden.advance(2750);hidden.advance(3200,false);hidden.assertReleased();
console.log('PASS: chalk progress, stroke lifts, 3.1-second reveal, Escape, reduced motion, module failure, missing module and background-tab completion.');
