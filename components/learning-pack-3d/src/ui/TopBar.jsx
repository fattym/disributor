import {useState} from "react";import {PRODUCTS,kes} from "../data/catalogue.js";import {useShop} from "../store/useShop.js";import {useSupermarketStore} from "@/lib/store/supermarketStore";
export default function TopBar(){const [q,setQ]=useState(""),ci=useSupermarketStore(s=>s.cartItems),count=ci.reduce((a,c)=>a+c.quantity,0),setPanel=useShop(s=>s.setPanel),setShowcaseOpen=useShop(s=>s.setShowcaseOpen),go=useShop(s=>s.goToProduct),
 res=q.trim()?PRODUCTS.filter(p=>(p.name+p.publisher).toLowerCase().includes(q.toLowerCase())).slice(0,6):[];
 return(<header className="top glass"><div className="logo">🎓 Learning Pack</div>
  <div className="search"><input aria-label="Search" placeholder="Search books, stationery or school supplies…" value={q} onChange={e=>setQ(e.target.value)}/>
   {res.length>0&&<div className="results">{res.map(p=><button key={p.id} onClick={()=>{go(p);setQ("")}}>{p.icon} {p.name} · {kes(p.price)}</button>)}</div>}</div>
  <button className="chip hide-m showcase-nav-btn" onClick={()=>setShowcaseOpen(true)}>✨ Inside Elimu Pepe</button>
  <button className="chip hide-m">Nairobi Primary · Grade 5</button><button className="chip hide-m" onClick={()=>setPanel("booklist")}>Booklist</button>
  <button className="chip blue" onClick={()=>setPanel("cart")}>🛒 Trolley <b className="badge">{count}</b></button></header>)}
