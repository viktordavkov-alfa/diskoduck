// Add the owner's verified checkout links when payment setup is ready.
// Each support link must match the displayed one-time USD amount. Null links
// intentionally keep checkout unavailable; browsing never creates a payment.
export const SUPPORT = {
  round:{amount:5,caption:'One shot. Slightly worse dancing.',checkoutUrl:null},
  ticket:{amount:12,caption:'His name is definitely not on the guest list.',checkoutUrl:null},
  night:{amount:20,caption:'Disco. Drinks. Whatever’s left can be dinner.',checkoutUrl:null}
};
export const PRODUCTS = {
  print:{checkoutUrl:null},
  shirt:{checkoutUrl:null}
};
const CHECKOUT_HOSTS=new Set(['buymeacoffee.com','www.buymeacoffee.com','ko-fi.com','www.ko-fi.com','buy.stripe.com','checkout.stripe.com']);
export function checkoutURL(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&CHECKOUT_HOSTS.has(url.hostname)?url.href:null;}
  catch{return null;}
}
