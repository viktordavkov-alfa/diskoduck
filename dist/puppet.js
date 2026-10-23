export const PALETTES={disco:'#245da8',techno:'#245da8',slow:'#245da8'};
export const PAPER_ASPECT=1.5;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function layout(width,height){
  // Revealing his story does not resize, fade or move the original paper duck.
  if(width<=700&&height>width){
    return {width:width*.82,height:height*.81,x:-width*.23,y:-height*.20};
  }
  if(width<=1049&&height>width){
    return {width:width*1.05,height:height*.98,x:width*.025,y:-height*.10};
  }
  return {width:Math.min(height*1.17*PAPER_ASPECT,width*.99),height:height*1.17,x:width*.025,y:-height*.061};
}
export function advanceSpring(s,targetX,targetY,dt){
  const step=Math.min(dt,1/30);
  s.vx+=(targetX-s.x)*68*step;s.vy+=(targetY-s.y)*60*step;
  s.vx*=Math.exp(-8.5*step);s.vy*=Math.exp(-9*step);
  s.x+=s.vx*step;s.y+=s.vy*step;return s;
}
export function makePose({time=0,beat=0,energy=1,bend=0,lift=0,tilt=0,peck=0,mode='disco'}={}){
  const b=beat*Math.PI*2;
  let sway=Math.sin(b*.5)*.012,bob=Math.sin(b)*.004,angle=Math.sin(b*.5-.6)*.018;
  if(mode==='techno'){sway=Math.sin(b*.5)*.01;bob=Math.max(0,Math.sin(b))*.008;angle=Math.sin(b)*.025;}
  if(mode==='slow'){sway=Math.sin(b*.25)*.016;bob=Math.sin(b*.5)*.003;angle=Math.sin(b*.25)*.016;}
  return {bend:bend+sway*energy,lift:lift*.035+bob*energy,tilt:tilt+angle*energy-peck*.04,ripple:energy*.0015,time};
}
// CPU form of the vertex deformation keeps picking attached to the moving paper.
export function deformUV(u,v,size,pose){
  const t=v,naturalHeight=Math.min(size.height,size.width/PAPER_ASPECT),extension=size.height-naturalHeight;
  const stem=smooth(0,.55,t),upper=smooth(.28,.48,t);
  let x=(u-.5)*size.width+pose.bend*size.height*Math.pow(stem,1.5);
  let y=(t-.5)*naturalHeight+(smooth(0,.44,t)-.5)*extension+pose.lift*size.height*stem;
  x+=Math.sin(t*5-pose.time*.8)*pose.ripple*size.height*stem*(1-upper);
  const px=size.width*.12,py=size.height*.02,a=pose.tilt*upper,c=Math.cos(a),s=Math.sin(a),dx=x-px,dy=y-py;
  return {x:c*dx+s*dy+px,y:-s*dx+c*dy+py};
}
export function pickUV(x,y,size,pose){
  // Start from the stretched neck's vertical mapping, including tall phones.
  const naturalHeight=Math.min(size.height,size.width/PAPER_ASPECT),extension=size.height-naturalHeight;
  let low=0,high=1;
  for(let i=0;i<12;i++){
    const middle=(low+high)/2;
    const mapped=(middle-.5)*naturalHeight+(smooth(0,.44,middle)-.5)*extension;
    if(mapped<y)low=middle;else high=middle;
  }
  let u=x/size.width+.5,v=(low+high)/2;
  for(let i=0;i<9;i++){
    const p=deformUV(u,v,size,pose),dx=x-p.x,dy=y-p.y;
    if(Math.abs(dx)+Math.abs(dy)<.02)break;
    const e=.0002,px=deformUV(u+e,v,size,pose),py=deformUV(u,v+e,size,pose);
    const a=(px.x-p.x)/e,b=(py.x-p.x)/e,c=(px.y-p.y)/e,d=(py.y-p.y)/e,det=a*d-b*c;
    if(Math.abs(det)<.00001)return null;
    u+=(d*dx-b*dy)/det;v+=(a*dy-c*dx)/det;
  }
  return u>=0&&u<1&&v>=0&&v<1?{u,v}:null;
}
export const vertexShader=`
uniform float uTime;
uniform float uBend;
uniform float uLift;
uniform float uTilt;
uniform float uRipple;
uniform vec2 uSize;
varying vec2 vUv;
void main(){
  vUv=uv;
  float t=uv.y;
  float naturalHeight=min(uSize.y,uSize.x/1.5);
  float extension=uSize.y-naturalHeight;
  float stem=smoothstep(0.0,.55,t),upper=smoothstep(.28,.48,t);
  vec3 p=vec3(position.x*uSize.x,position.y*naturalHeight+(smoothstep(0.0,.44,t)-.5)*extension,position.z);
  p.x+=uBend*uSize.y*pow(stem,1.5);
  p.y+=uLift*uSize.y*stem;
  p.x+=sin(t*5.0-uTime*.8)*uRipple*uSize.y*stem*(1.0-upper);
  vec2 pivot=vec2(uSize.x*.12,uSize.y*.02);
  float angle=uTilt*upper,c=cos(angle),s=sin(angle);
  p.xy=mat2(c,-s,s,c)*(p.xy-pivot)+pivot;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
export const fragmentShader=`
uniform sampler2D uArtwork;
uniform sampler2D uReference;
uniform sampler2D uFront;
uniform float uBlink;
uniform float uTipsy;
uniform float uFacing;
varying vec2 vUv;
vec3 blinkEye(vec3 color,vec2 uv,vec2 center,vec3 paper,vec2 radius){
  vec2 d=uv-center;
  float area=1.0-smoothstep(1.0,1.25,max(abs(d.x)/radius.x,abs(d.y)/radius.y));
  float ink=1.0-smoothstep(.22,.45,max(color.r,max(color.g,color.b)));
  float lid=radius.y*(1.0-uBlink*.97);
  float blink=smoothstep(lid,lid+.001,abs(d.y));
  float droop=radius.y*(1.0-uTipsy*(center.x>.6?1.6:1.3));
  float sleepy=smoothstep(droop,droop+.0015,d.y)*step(.01,uTipsy);
  return mix(color,paper,area*ink*max(blink,sleepy));
}
void main(){
  vec4 original=texture2D(uArtwork,vUv);
  vec3 color=texture2D(uReference,vUv).rgb;
  vec3 eyePaper=texture2D(uReference,vUv+vec2(.016,0.0)).rgb;
  color=blinkEye(color,vUv,vec2(.5638,.781),eyePaper,vec2(.006,.012));
  color=blinkEye(color,vUv,vec2(.6646,.722),eyePaper,vec2(.006,.012));
  vec3 ref=texture2D(uReference,vUv).rgb;
  float edge=1.0-smoothstep(.035,.11,ref.b-ref.r);
  float sideAlpha=min(1.0,original.a*1.008)*edge;
  vec4 front=texture2D(uFront,vUv);
  vec3 frontPaper=texture2D(uFront,vUv+vec2(.021,0.0)).rgb;
  front.rgb=blinkEye(front.rgb,vUv,vec2(.5456,.7383),frontPaper,vec2(.008,.014));
  front.rgb=blinkEye(front.rgb,vUv,vec2(.651,.7383),frontPaper,vec2(.008,.014));
  float alpha=mix(sideAlpha,front.a,uFacing);
  if(alpha<.006)discard;
  vec3 combined=mix(color*sideAlpha,front.rgb*front.a,uFacing)/max(alpha,.0001);
  gl_FragColor=vec4(combined,alpha);
}`;
export const paperVertexShader=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
export const paperFragmentShader=`
uniform sampler2D uReference;
uniform vec2 uViewport;
uniform vec3 uTint;
varying vec2 vUv;
void main(){
  vec2 pixel=vUv*uViewport;
  vec2 mirrored=1.0-abs(mod(pixel/vec2(640.0,180.0),2.0)-1.0);
  // A clean, character-free paper patch from the approved mockup.
  vec2 uv=vec2((40.0+mirrored.x*640.0)/1536.0,1.0-(130.0+mirrored.y*180.0)/1024.0);
  vec3 color=texture2D(uReference,uv).rgb*uTint;
  gl_FragColor=vec4(color,1.0);
}`;
