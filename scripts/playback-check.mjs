import assert from 'node:assert/strict';
import {DuckMusic,TRACKS} from '../dist/music.js';
import {shotEffects} from '../dist/party.js';

class TestAudio extends EventTarget{
  constructor(){super();this.paused=true;this.currentTime=0;this.duration=200;this.ended=false;this.pending=null;}
  set src(value){this.source=value;this.currentTime=0;}
  get src(){return this.source;}
  async play(){this.paused=false;if(this.pending)await this.pending;}
  pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
}
const audio=new TestAudio(),music=new DuckMusic(audio);
assert.equal(music.status,'idle');assert.equal(audio.preload,'none');
await music.start();assert(music.playing);
audio.currentTime=37;music.pause();assert.equal(music.status,'paused');assert.equal(music.time,37);
await music.start();assert(music.playing);assert.equal(music.time,37,'Resume must preserve song position.');
music.stop();assert.equal(music.time,0);assert.equal(music.status,'stopped');assert(!music.playing);
await music.next();assert.equal(music.index,1);assert(!music.playing,'Skipping a stopped song must not auto-start.');
await music.select(2,{autoplay:true});assert(music.playing);assert.equal(music.index,2);
await music.next();assert.equal(music.index,0,'Playlist must wrap.');assert(music.playing);
audio.currentTime=24;await music.previous();assert.equal(music.index,0);assert.equal(music.time,0);
await music.previous();assert.equal(music.index,TRACKS.length-1);
music.seek(999);assert.equal(music.time,200);music.seek(-8);assert.equal(music.time,0);
await music.visibility(true);assert(!music.playing);assert(music.resumeOnVisible);
await music.visibility(false);assert(music.playing);
music.stop();await music.visibility(true);await music.visibility(false);assert(!music.playing,'Visibility must respect an explicit stop.');
let resolve;audio.pending=new Promise(done=>{resolve=done;});const start=music.start();music.stop();resolve();await start;
assert.equal(music.status,'stopped','A late play promise must not override Stop.');
assert(!music.playing);
for(let shot=1;shot<=8;shot++){
  assert(shotEffects(shot).energy>shotEffects(shot-1).energy);
  assert(shotEffects(shot).tipsy>shotEffects(shot-1).tipsy);
}
assert.deepEqual(shotEffects(1000),shotEffects(8),'Visual effects must have a stable upper bound.');
console.log('PASS: pause/resume, stop, previous/next, playlist wrap, seek limits, background restore, loading cancellation, and progressive bounded shot effects.');
