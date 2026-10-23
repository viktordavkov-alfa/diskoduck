export function shotEffects(shots){
  const level=Math.max(0,Math.min(8,Number(shots)||0));
  return {energy:1+level*.09,tipsy:level/8,wobble:level*.0014};
}
// Preview shots are a local animation, never a payment or a donation total.
// A future checkout webhook must verify purchases before granting paid shots.
export function initParty(onChange){
  let shots=0;
  const count=document.getElementById('drinks-count'),button=document.getElementById('preview-shot'),status=document.getElementById('shot-status');
  function preview(){
    shots++;count.textContent=String(shots);onChange(shots);
    document.querySelectorAll('#shot-glasses > svg').forEach((glass,index)=>glass.classList.toggle('is-filled',index<shots));
    status.textContent=shots===1?'One pretend shot. One worse dancer.':shots<5?`${shots} pretend shots. The confidence is growing.`:`${shots} pretend shots. Nobody is taking his keys.`;
    button.textContent='another shot · preview';
  }
  button.addEventListener('click',preview);
  return {get shots(){return shots;},preview};
}
