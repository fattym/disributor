import {useEffect,useState} from "react";
import {kes} from "../data/catalogue.js";
import {useShop} from "../store/useShop.js";

export default function ProductCard(){
 const p=useShop(s=>s.selected),add=useShop(s=>s.add),close=useShop(s=>s.closeAll),say=useShop(s=>s.say),[q,setQ]=useState(1);
 useEffect(()=>setQ(1),[p]);
 if(!p)return null;

 const imgSrc=p.cover_image||p.image_url||p.image;

 return(
  <aside className="card glass product-card-modal" role="dialog" aria-label={p.name||p.title}>
   <button className="x" onClick={close} aria-label="Close">✕</button>
   <div className="row">
    {imgSrc?(
     <div className="product-cover-container">
      <img
       src={imgSrc}
       alt={p.name||p.title}
       className="product-cover-img"
       onError={e=>{
        e.currentTarget.onerror=null;
        e.currentTarget.src="/assets/profile/kids.png";
       }}
      />
     </div>
    ):(
     <div className="sw" style={{background:(p.color||"#2563eb")+"33"}}>{p.icon||"📘"}</div>
    )}
    <div>
     <h3>{p.name||p.title}</h3>
     <div>{p.publisher||p.brand||"Learning Pack"} · {p.grade||"CBC Aligned"}</div>
     <div className={(p.stock&&p.stock.startsWith("Low"))?"low":"ok"}>{p.stock||"In stock"}</div>
     <div className="price">{kes(p.price)}</div>
    </div>
   </div>
   <div className="act">
    <span className="qty">
     <button onClick={()=>setQ(Math.max(1,q-1))}>−</button>
     <b>{q}</b>
     <button onClick={()=>setQ(q+1)}>+</button>
    </span>
     <button className="btn" onClick={()=>{add(p.backendId||p.id,q);say(`Added ${q} × ${p.name||p.title}`);close()}}>
     Add to Trolley
    </button>
   </div>
  </aside>
 );
}
