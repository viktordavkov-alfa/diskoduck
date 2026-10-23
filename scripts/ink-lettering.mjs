import fs from 'node:fs';
import path from 'node:path';
// Original single-line pen lettering. Each path follows a writing stroke,
// so the reveal draws the letters rather than typing or wiping them on.
const glyphs={
 a:[16,['M12 15C1 8-1 31 7 30 13 29 13 19 12 15L12 30 15 29']],
 b:[16,['M4 3 2 29 3 21C8 9 17 14 14 24 12 32 4 33 3 27']],
 d:[16,['M12 16C2 8-1 27 5 30 12 34 14 22 13 15L15 2 13 30']],
 e:[15,['M3 23C18 23 15 10 7 14-2 18 2 36 14 28']],
 f:[11,['M10 3C4-1 4 9 3 17L2 36','M0 16 11 15']],
 g:[16,['M13 16C3 7-1 28 7 30 14 31 14 20 13 16L12 34Q11 46 1 38']],
 h:[16,['M4 2 2 30 4 22C7 10 14 13 13 21L12 30']],
 i:[7,['M3 15 2 30','M4 6 4.3 6.5']],
 k:[15,['M4 2 2 30','M14 14 3 23 14 31']],
 l:[8,['M5 2 3 26Q2 33 7 30']],
 m:[23,['M2 15 2 30 4 21C7 9 12 14 11 23L10 30 12 21C16 8 22 14 20 23L19 30']],
 n:[16,['M3 15 2 30 4 21C9 9 16 14 13 23L12 30']],
 o:[16,['M10 14C-2 10-1 32 8 31 17 29 17 13 10 14']],
 p:[16,['M4 15 2 41','M4 21C9 8 19 15 13 26 10 32 4 32 3 26']],
 r:[12,['M3 15 2 30 4 21C7 13 10 12 12 16']],
 s:[14,['M12 15C4 8-1 21 7 23 19 26 10 36 1 29']],
 t:[11,['M6 5 4 25Q3 34 10 28','M0 16 11 15']],
 u:[16,['M3 15 2 24C0 35 11 31 13 20L14 14 12 30']],
 w:[22,['M2 15Q0 35 8 29L12 18Q12 36 19 28L22 14']],
 y:[16,['M3 14Q0 34 10 27L14 14 10 34Q6 45 1 38']],
 '?':[16,['M1 9C2 0 19 1 14 12 12 17 7 15 7 24','M7 31 7.3 31.4']],
 "'":[6,['M4 8 2 14']],
 '0':[20,['M12 2C-1-1-2 32 9 32 22 32 23 1 12 2']],
 '4':[22,['M16 2 2 23 21 22','M16 7 14 34']],
 '5':[21,['M20 3 6 3 4 18C14 11 24 22 16 29 11 34 3 30 2 27']],
 '$':[22,['M20 6C10-3-2 10 11 16 28 23 13 37 2 27','M14 0 10 37']],
 ' ':[10,[]]
};
function lettering(text){
 let x=0;const strokes=[];
 [...text].forEach((char,i)=>{
  const glyph=glyphs[char];if(!glyph)throw new Error(`No pen glyph for ${char}`);
  const wobble=[0,.4,-.35,.25,-.1][i%5];
  for(const d of glyph[1])strokes.push({d,x,y:wobble,weight:Math.max(8,d.length),char});
  x+=glyph[0]+1;
 });
 return {strokes,width:x-1};
}
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist/assets');
const phrase=lettering('why is he poor?'),weight=phrase.strokes.reduce((n,s)=>n+s.weight,0);
let delay=.35;
const strokes=phrase.strokes.map(s=>{
 const duration=2.35*s.weight/weight;
 const result=`<path class="pen-stroke" pathLength="1" d="${s.d}" transform="translate(${s.x} ${s.y})" style="--delay:${delay.toFixed(3)}s;--duration:${duration.toFixed(3)}s"/>`;
 delay+=duration+.018;return result;
}).join('\n');
const circleDelay=delay+.16;
const button=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 108" fill="none" stroke="#f4e7c8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<title>why is he poor?</title>
<style>.pen-stroke{opacity:0;stroke-dasharray:1;stroke-dashoffset:1;animation:write var(--duration) linear var(--delay) forwards}.circle{stroke-width:1.45}@keyframes write{from{opacity:1}to{opacity:1;stroke-dashoffset:0}}@media(prefers-reduced-motion:reduce){.pen-stroke{animation:none;opacity:1;stroke-dashoffset:0}}</style>
<g transform="translate(${((270-phrase.width)/2).toFixed(1)} 30)">
${strokes}
</g>
<path class="pen-stroke circle" pathLength="1" style="--delay:${circleDelay.toFixed(3)}s;--duration:.72s" d="M233 84C196 102 69 103 29 83 4 71 5 43 34 29 79 8 207 8 239 30 272 52 252 83 215 92 166 103 77 102 40 91"/>
</svg>\n`;
fs.writeFileSync(path.join(out,'why-poor.svg'),button);
for(const [file,label]of Object.entries({'tab-title':"today's tab",'tab-drinks':'drinks today','tab-needed':'needs tonight','tab-food':'food budget','tab-zero':'0','tab-goal':'$45','tab-maybe':'maybe'})){
 const ink=lettering(label);
 fs.writeFileSync(path.join(out,`${file}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${ink.width+4} 48" fill="none" stroke="#f4e7c8" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><title>${label}</title>${ink.strokes.map(s=>`<path d="${s.d}" transform="translate(${s.x} ${s.y})"/>`).join('')}</svg>\n`);
}
console.log(JSON.stringify({text:'why is he poor?',strokes:phrase.strokes.length,circleStartsAfterSeconds:Number(circleDelay.toFixed(3)),finishedAfterSeconds:Number((circleDelay+.72).toFixed(3)),assets:9}));
