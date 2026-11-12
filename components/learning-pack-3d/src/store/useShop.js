import {create} from "zustand";
import {persist} from "zustand/middleware";
import {PRODUCTS,BOOKLIST,BUNDLE_ID,CATEGORIES} from "../data/catalogue.js";
import {aisleStand} from "../data/layout.js";
import {fetchProducts,resolveImageUrl} from "../api.js";
import {useSupermarketStore} from "@/lib/store/supermarketStore";

let t;
export const useShop=create(persist((set,get)=>({
  xp:0,coins:0,got:[],selected:null,selectedKey:null,panel:null,toast:null,teleport:null,
  showcaseOpen:true,
  products:PRODUCTS,
  categories:CATEGORIES,
  loadingProducts:false,
  setShowcaseOpen:showcaseOpen=>set({showcaseOpen}),
  toggleShowcase:()=>set(s=>({showcaseOpen:!s.showcaseOpen})),
  add:(id,q=1,quiet=false)=>{useSupermarketStore.getState().addToCart(id,q);set(s=>({xp:s.xp+(q>0&&!quiet?10*q:0)}))},
  remove:id=>{useSupermarketStore.getState().removeFromCart(id);},
  clear:()=>{useSupermarketStore.getState().clearCart();},
  loadBackendProducts:async()=>{
   set({loadingProducts:true});
   try{
    const RAW_API=typeof process!=="undefined"&&process.env.NEXT_PUBLIC_API_URL?process.env.NEXT_PUBLIC_API_URL:"http://localhost:8000/api";
    const API=RAW_API.replace(/\/+$/,"");
    const pageSize=200;
    const mapItems=(apiItems)=>{
     const mapped=[...PRODUCTS];
     apiItems.forEach((item,idx)=>{
      const shelfIndex=idx%32;
      const catIndex=Math.floor(shelfIndex/4);
      const img=resolveImageUrl(item.image_url||item.cover_image||item.image);
      mapped[shelfIndex]={
       ...mapped[shelfIndex],
       id:shelfIndex,
       backendId:item.id,
       name:item.name||item.title||mapped[shelfIndex]?.name,
       title:item.title||item.name||mapped[shelfIndex]?.name,
       publisher:item.brand||item.distributor_name||mapped[shelfIndex]?.publisher||"Learning Pack",
       brand:item.brand||item.distributor_name||mapped[shelfIndex]?.publisher||"Learning Pack",
       price:parseFloat(item.price||item.effective_price||mapped[shelfIndex]?.price||0),
       image:img,
       image_url:img,
       cover_image:img,
       category:catIndex,
       color:CATEGORIES[catIndex]?.color||"#2563eb",
       icon:CATEGORIES[catIndex]?.icon||"📘",
       stock:"In stock",
      };
     });
     return mapped;
    };
    const r1=await fetch(`${API}/shop/public/?page_size=${pageSize}&page=1`);
    if(!r1.ok){ set({loadingProducts:false}); return; }
    const d1=await r1.json();
    const all=Array.isArray(d1)?d1:[...(d1.results||[])];
    if(all.length>0) set({products:mapItems(all),loadingProducts:false}); else set({loadingProducts:false});
    const count=Array.isArray(d1)?all.length:(d1.count||all.length);
    if(count>all.length){
     const totalPages=Math.ceil(count/pageSize);
     const pageNums=[]; for(let p=2;p<=totalPages;p++) pageNums.push(p);
     const batchSize=6;
     for(let i=0;i<pageNums.length;i+=batchSize){
      const batch=pageNums.slice(i,i+batchSize);
      const pages=await Promise.all(batch.map(p=>fetch(`${API}/shop/public/?page_size=${pageSize}&page=${p}`).then(r=>r.ok?r.json():null)));
      for(const pg of pages){ if(pg&&pg.results) all.push(...pg.results); }
      set({products:mapItems(all)});
     }
    }
   }catch(e){
    console.warn("Failed to load products from API:",e);
    set({loadingProducts:false});
   }
  },
  select:(p,key=null)=>set({selected:p,selectedKey:key}),
  setPanel:p=>set(s=>({panel:s.panel===p?null:p,selected:null,selectedKey:null})),
  closeAll:()=>set({panel:null,selected:null,selectedKey:null}),
  say:m=>{set({toast:m});clearTimeout(t);t=setTimeout(()=>set({toast:null}),2600)},
  addMissing:()=>{
   const ci=useSupermarketStore.getState().cartItems;
   const doneIds=new Set(ci.map(c=>c.variant_id));
   const products=get().products;
   BOOKLIST.forEach(i=>{const p=products[i];const id=p&&p.backendId?p.backendId:null; if(id&&!doneIds.has(id)&&!doneIds.has(BUNDLE_ID)){useSupermarketStore.getState().addToCart(id,1);}});
  },
}),{name:"lp3d_v2",partialize:s=>({xp:s.xp,coins:s.coins,got:s.got})}));

export const cartCount=()=>useSupermarketStore.getState().cartItems.reduce((a,c)=>a+c.quantity,0);
export const cartTotal=()=>{
 const ci=useSupermarketStore.getState().cartItems;
 const products=useShop.getState().products;
 return ci.reduce((a,c)=>{const p=products.find(pp=>pp.backendId===c.variant_id);return a+(p?p.price*c.quantity:0);},0);
};
export const isDone=(id)=>!!useSupermarketStore.getState().cartItems.find(c=>c.variant_id===id);
export const cartItems=()=>useSupermarketStore.getState().cartItems;
