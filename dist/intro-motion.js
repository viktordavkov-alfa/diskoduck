// A short hand-drawn sequence: lift the chalk between real, separate strokes.
export const REVEAL_AT = 2740;
export const REVEAL_DURATION = 360;
export const STROKES = [
  {id:'outline',chalk:'ivory',start:130,duration:680},
  {id:'crest',chalk:'ivory',start:860,duration:150},
  {id:'neck',chalk:'ivory',start:1070,duration:210},
  {id:'eye-left',chalk:'ivory',start:1330,duration:90},
  {id:'eye-right',chalk:'ivory',start:1460,duration:90},
  {id:'beak',chalk:'coral',start:1810,duration:540},
  {id:'mouth',chalk:'coral',start:2390,duration:110},
  {id:'nostril',chalk:'coral',start:2530,duration:60},
];
export const clamp = (x,min=0,max=1)=>Math.min(max,Math.max(min,x));
export const smooth = t=>{t=clamp(t);return t*t*(3-2*t);};

// Ease only the ends of each stroke. The middle keeps a steady hand-written pace.
export function handProgress(t){
  t=clamp(t);
  const ramp=.12,area=1-ramp;
  if(t<ramp)return t*t/(2*ramp*area);
  if(t>1-ramp)return 1-(1-t)*(1-t)/(2*ramp*area);
  return (t-ramp/2)/area;
}

// Allocate more time to corners, without changing the line the chalk follows.
export function buildPaceMap(points){
  let total=0;
  const map=[{distance:0,weight:0}];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],c=points[Math.min(i+1,points.length-1)];
    const dx=b.x-a.x,dy=b.y-a.y,nx=c.x-b.x,ny=c.y-b.y;
    const distance=Math.hypot(dx,dy),next=Math.hypot(nx,ny);
    const bend=distance&&next?Math.acos(clamp((dx*nx+dy*ny)/(distance*next),-1,1)):0;
    total+=distance*(1+Math.min(bend*1.8,2));
    map.push({distance:b.distance,weight:total});
  }
  for(const p of map)p.weight=total?p.weight/total:0;
  return map;
}

export function pacedDistance(map,progress){
  progress=clamp(progress);
  if(progress===0)return 0;
  if(progress===1)return map.at(-1).distance;
  let lo=0,hi=map.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(map[m].weight<progress)lo=m;else hi=m;}
  const a=map[lo],b=map[hi],span=b.weight-a.weight;
  return a.distance+(b.distance-a.distance)*(span?(progress-a.weight)/span:0);
}

export function liftPoint(from,to,t){
  const p=smooth(t),lift=Math.min(20,Math.hypot(to.x-from.x,to.y-from.y)*.12);
  return {x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p-Math.sin(Math.PI*p)*lift};
}
