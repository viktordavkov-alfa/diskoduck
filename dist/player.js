import {TRACKS} from './music.js?v=8';
const clock=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
export function initPlayer(music,{toggle,stop}){
  const $=id=>document.getElementById(id),picker=$('song-picker'),list=$('song-list'),seek=$('song-progress');
  for(const [index,track]of TRACKS.entries()){
    const button=document.createElement('button');button.type='button';button.className='song-choice';
    button.setAttribute('aria-label',`Play ${track.title} by ${track.artist}`);
    const title=document.createElement('span');title.textContent=track.title;
    const bpm=document.createElement('small');bpm.textContent=`${track.bpm} bpm`;button.append(title,bpm);
    button.addEventListener('click',()=>{picker.open=false;music.select(index,{autoplay:true});$('music-play').focus({preventScroll:true});});
    list.append(button);
  }
  function sync(){
    const playing=music.playing,loading=music.status==='loading';
    $('song-title').textContent=music.track.title;
    $('music-play').setAttribute('aria-label',playing?'Pause music':'Play music');
    $('music-play').title=playing?'Pause':'Play';$('music-play').setAttribute('aria-pressed',String(playing));
    $('player-play-icon').toggleAttribute('hidden',playing);$('player-pause-icon').toggleAttribute('hidden',!playing);
    $('music-player').classList.toggle('is-playing',playing);$('music-player').classList.toggle('is-loading',loading);
    $('player-status').textContent=music.status==='error'?'Couldn’t load that track. Try the next one.':loading?'Loading track…':'';
    $('song-time').textContent=`${clock(music.time)} / ${clock(music.duration)}`;
    seek.disabled=!Number.isFinite(music.audio.duration);seek.max=String(music.duration);seek.value=String(music.time);
    seek.setAttribute('aria-valuetext',`${clock(music.time)} of ${clock(music.duration)}`);
    seek.style.setProperty('--played',`${music.time/music.duration*100}%`);
    [...list.children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===music.index)));
  }
  $('music-play').addEventListener('click',toggle);$('music-stop').addEventListener('click',stop);
  $('music-previous').addEventListener('click',()=>music.previous());$('music-next').addEventListener('click',()=>music.next());
  seek.addEventListener('input',()=>music.seek(Number(seek.value)));
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.open=false;picker.querySelector('summary').focus();}});
  document.addEventListener('pointerdown',event=>{if(!picker.contains(event.target))picker.open=false;});
  music.addEventListener('change',sync);sync();
}
