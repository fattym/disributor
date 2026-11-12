import {useState} from "react";import {useShop} from "../store/useShop.js";
export default function BottomNav(){const [on,setOn]=useState("browse"),{setPanel,closeAll,say}=useShop(),T=[["browse","🗂️","Browse",()=>closeAll()],["booklist","📖","Booklist",()=>setPanel("booklist")],["cart","🛒","Trolley",()=>setPanel("cart")],["acct","👤","Account",()=>say("Sign-in arrives with the Django auth integration")]];
 return(<nav className="bottom glass">{T.map(([k,i,l,fn])=><button key={k} className={on===k?"on":""} onClick={()=>{setOn(k);fn()}}><span>{i}</span>{l}</button>)}</nav>)}
