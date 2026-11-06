import {create} from "zustand";import {persist} from "zustand/middleware";
import {PRODUCTS,BOOKLIST,BUNDLE_ID} from "../data/catalogue.js";import {aisleStand} from "../data/layout.js";
let t;
export const useShop=create(persist((set,get)=>({
 cart:{},xp:0,coins:0,got:[],selected:null,selectedKey:null,panel:null,toast:null,teleport:null,
 select:(p,key=null)=>set({selected:p,selectedKey:key}),
 setPanel:p=>set(s=>({panel:s.panel===p?null:p,selected:null,selectedKey:null})),
 closeAll:()=>set({panel:null,selected:null,selectedKey:null}),
 say:m=>{set({toast:m});clearTimeout(t);t=setTimeout(()=>set({toast:null}),2600)},
 add:(id,q=1,quiet=false)=>set(s=>{const n=(s.cart[id]||0)+q,cart={...s.cart};if(n>0)cart[id]=n;else delete cart[id];return{cart,xp:s.xp+(q>0&&!quiet?10*q:0)}}),
 remove:id=>set(s=>{const cart={...s.cart};delete cart[id];return{cart}}),
 clear:()=>set({cart:{}}),
 collectCoin:i=>set(s=>s.got.includes(i)?s:{got:[...s.got,i],coins:s.coins+1,xp:s.xp+15}),
 goToProduct:p=>set({teleport:{...aisleStand(p.category),n:Math.random()},selected:p,selectedKey:null}),
 addMissing:()=>{const {cart,add}=get();BOOKLIST.filter(i=>!cart[i]&&!cart[BUNDLE_ID]).forEach(i=>add(i,1,true))},
}),{name:"lp3d_v2",partialize:s=>({cart:s.cart,xp:s.xp,coins:s.coins,got:s.got})}));
export const cartCount=c=>Object.entries(c).reduce((a,[id,q])=>PRODUCTS[id]?a+q:a,0);
export const cartTotal=c=>Object.entries(c).reduce((a,[id,q])=>PRODUCTS[id]?a+PRODUCTS[id].price*q:a,0);
export const isDone=(c,id)=>!!(c[id]||c[BUNDLE_ID]);
