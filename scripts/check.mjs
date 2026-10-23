import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {layout,advanceSpring,PALETTES,makePose,deformUV,pickUV} from '../dist/puppet.js';
import {TRACKS} from '../dist/music.js';
const root=path.resolve(import.meta.dirname,'..');
for(const file of ['app.js','puppet.js','music.js','story.js','commerce.js','chalk.js','nudges.js','player.js','party.js','intro.js','intro-motion.js'])execFileSync(process.execPath,['--check',path.join(root,'dist',file)]);
for(const file of ['index.html','style.css','app.js','puppet.js','music.js','story.js','commerce.js','chalk.js','nudges.js','player.js','party.js','intro.js','intro-motion.js','intro.css']){
 const source=fs.readFileSync(path.join(root,'dist',file),'utf8');
 for(const m of source.matchAll(/(?:src=|href=|url\(|from\s+)["'](\.\/[^"')]+)["']/g))assert(fs.existsSync(path.resolve(root,'dist',m[1].split('?')[0])),`Missing asset ${m[1]}`);
}
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length);
for(const file of ['app.js','story.js','player.js'])for(const m of fs.readFileSync(path.join(root,'dist',file),'utf8').matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(m[1]),`Missing target ${m[1]}`);
assert(!/<dialog\b/.test(html),'His story expands directly on the page.');
assert(TRACKS.length===3&&TRACKS.every(track=>PALETTES[track.mood]&&fs.existsSync(path.join(root,'dist',track.src))),'Every track needs a mood and a local file.');
const frames=[];
for(const [w,h]of [[1440,900],[1366,768],[820,1180],[390,844],[375,667],[844,390]]){
 const p=layout(w,h);for(const n of Object.values(p))assert(Number.isFinite(n));
 const top=h/2-p.y-p.height/2,bottom=top+p.height;
 const crown=deformUV(.68,.96,p,{bend:0,lift:0,tilt:0,ripple:0,time:0}),crownTop=h/2-p.y-crown.y;
 assert(crownTop>0&&crownTop<h*.5,'The visible crown stays inside the viewport.');
 assert(bottom>h,'Neck must extend below the viewport.');
 assert.deepEqual(layout(w,h,true),p,'Revealing the story must not move or resize the duck.');
 frames.push({viewport:`${w}x${h}`,image:[p.width,p.height].map(Math.round),top:Math.round(top),bottom:Math.round(bottom)});
}
for(const fps of [30,60,120]){
 const s={x:0,y:0,vx:0,vy:0};
 for(let i=0;i<fps*2;i++)advanceSpring(s,.17,-.8,1/fps);
 assert(Math.abs(s.x-.17)<.001&&Math.abs(s.y+.8)<.001,'Drag should converge.');
 for(let i=0;i<fps*3;i++)advanceSpring(s,0,0,1/fps);
 assert(Math.abs(s.x)<.001&&Math.abs(s.y)<.001,'Release should settle.');
}
let pickChecks=0;
for(const [w,h]of [[1440,900],[390,844],[375,667]])for(const mode of Object.keys(PALETTES))for(const bend of [0,.15,-.15])for(const [u,v]of [[.564,.781],[.665,.722],[.15,.48],[.65,.22]]){
 const size=layout(w,h),pose=makePose({time:1,beat:.25,mode,bend,tilt:bend*.22}),point=deformUV(u,v,size,pose),picked=pickUV(point.x,point.y,size,pose);
 assert(picked&&Math.hypot(picked.u-u,picked.v-v)<.0002,'Picking must follow the moving paper.');pickChecks++;
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json')));assert.equal(manifest.static.directory,'dist');
for(const [word,target]of [['tickets','help-ticket'],['drinks','help-shot'],['clothes','merch-open']])assert(html.includes(`data-nudge="${target}" aria-controls="${target}">${word}</button>`),'Each word must link to its matching action.');
assert(/id="story-lines"[^>]* hidden/.test(html),'The story is hidden on initial load.');
console.log(JSON.stringify({result:'PASS',story:'inline',pickChecks,frames,spring:'stable at 30, 60 and 120 fps',browserQA:'Unavailable: required control-browser skill is not exposed.'},null,2));
