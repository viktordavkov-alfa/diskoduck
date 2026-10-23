export const TRACKS=Object.freeze([
  {id:'dance-monster',title:'Dance Monster',artist:'Kevin MacLeod',bpm:120,mood:'disco',duration:200.1,src:'./assets/audio/dance-monster.mp3',isrc:'USUAN1100272'},
  {id:'club-diver',title:'Club Diver',artist:'Kevin MacLeod',bpm:140,mood:'techno',duration:145.7,src:'./assets/audio/club-diver.mp3',isrc:'USUAN1200020'},
  {id:'shiny-tech',title:'Shiny Tech',artist:'Kevin MacLeod',bpm:138,mood:'disco',duration:222.7,src:'./assets/audio/shiny-tech.mp3',isrc:'USUAN1100078'}
]);

// Unmodified artist recordings, self-hosted under CC BY 4.0. See music-credits.html.
export class DuckMusic extends EventTarget{
  constructor(audio=new Audio()){
    super();this.audio=audio;this.index=0;this.status='idle';this.request=0;this.resumeOnVisible=false;
    audio.preload='none';audio.volume=.65;audio.src=this.track.src;
    for(const event of ['timeupdate','loadedmetadata','durationchange'])audio.addEventListener(event,()=>this.notify());
    audio.addEventListener('ended',()=>this.select(this.index+1,{autoplay:true}));
    audio.addEventListener('pause',()=>{if(this.status==='playing'&&this.audio.paused){this.status='paused';this.notify();}});
    audio.addEventListener('error',()=>{this.status='error';this.notify();});
  }
  get track(){return TRACKS[this.index];}
  get playing(){return this.status==='playing'&&!this.audio.paused;}
  get muted(){return this.audio.muted;}
  get time(){return Number.isFinite(this.audio.currentTime)?this.audio.currentTime:0;}
  get duration(){return Number.isFinite(this.audio.duration)?this.audio.duration:this.track.duration;}
  notify(){this.dispatchEvent(new Event('change'));}
  async start(){
    if(this.status==='error')this.audio.load();
    const request=++this.request;this.status='loading';this.notify();
    try{await this.audio.play();if(request!==this.request)return false;this.status='playing';this.notify();return true;}
    catch(error){if(request!==this.request)return false;this.status='error';this.notify();return false;}
  }
  pause(){++this.request;this.resumeOnVisible=false;this.status='paused';this.audio.pause();this.notify();}
  stop(){++this.request;this.resumeOnVisible=false;this.status='stopped';this.audio.pause();this.audio.currentTime=0;this.notify();}
  async select(index,{autoplay=this.playing}={}){
    ++this.request;this.resumeOnVisible=false;this.audio.pause();
    this.index=((index%TRACKS.length)+TRACKS.length)%TRACKS.length;
    this.audio.src=this.track.src;this.status=this.status==='idle'?'idle':'stopped';this.notify();
    return autoplay?this.start():false;
  }
  next(){return this.select(this.index+1);}
  previous(){if(this.time>3){this.seek(0);return Promise.resolve(this.playing);}return this.select(this.index-1);}
  seek(seconds){if(!Number.isFinite(this.audio.duration))return;this.audio.currentTime=Math.max(0,Math.min(this.audio.duration,seconds));this.notify();}
  setMuted(muted){this.audio.muted=muted;this.notify();}
  getBeat(){return this.time*this.track.bpm/60;}
  async visibility(hidden){
    if(hidden&&this.playing){this.pause();this.resumeOnVisible=true;}
    else if(this.resumeOnVisible){this.resumeOnVisible=false;await this.start();}
  }
}
