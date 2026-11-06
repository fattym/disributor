import {useState} from "react";import {PRODUCTS,kes} from "../data/catalogue.js";import {useShop,cartTotal} from "../store/useShop.js";import {checkout,DEMO} from "../api.js";
const PHONE=/^(\+?254|0)\d{9}$/;
export default function Checkout(){const {cart,panel,closeAll,clear,say}=useShop(),[f,setF]=useState({name:"",phone:"",school:"Nairobi Primary School",grade:"Grade 5",delivery:true,address:""}),[done,setDone]=useState(null),[busy,setBusy]=useState(false);
 if(panel!=="checkout")return null;const sub=cartTotal(cart),fee=f.delivery?300:0,set=k=>e=>setF({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value});
 const lines=Object.entries(cart).filter(([id])=>PRODUCTS[id]);
 async function pay(){if(!lines.length){say("Your trolley is empty");return}if(!f.name.trim()){say("Enter the parent's name");return}if(!PHONE.test(f.phone.replace(/\s/g,""))){say("Enter a valid M-Pesa number, e.g. 0712 345 678");return}if(f.delivery&&!f.address.trim()){say("Enter a delivery address, or choose in-store collection");return}
  setBusy(true);try{const r=await checkout({parent_name:f.name.trim(),phone:f.phone.replace(/\s/g,""),school:f.school,grade:f.grade,fulfilment:f.delivery?"delivery":"collection",address:f.address,items:lines.map(([id,qty])=>({product:+id,quantity:qty}))});setDone(r);clear()}catch(e){say(e.message)}setBusy(false)}
 return(<div className="modal" onClick={e=>e.target===e.currentTarget&&closeAll()}><div className="box glass">{done?<><h2>{done.demo?"Demo order confirmed":"Check your phone"}</h2>
  {done.demo?<div className="demo">Simulation only. No payment was taken and no order was placed.</div>:<p>Enter your M-Pesa PIN on the prompt. We confirm your order once Safaricom verifies the payment.</p>}
  <p>Order <b>{done.order_id}</b></p><button className="btn w" onClick={()=>{setDone(null);closeAll()}}>Done</button></>:<><h2>Checkout</h2>
  {DEMO&&<div className="demo">DEMO ONLY: no payment details are collected and no real M-Pesa charge is made.</div>}
  <label>Parent name<input value={f.name} onChange={set("name")}/></label><label>Phone (M-Pesa)<input inputMode="tel" placeholder="07XX XXX XXX" value={f.phone} onChange={set("phone")}/></label>
  <label>Child’s school<input value={f.school} onChange={set("school")}/></label><label>Grade<input value={f.grade} onChange={set("grade")}/></label>
  <label className="check"><input type="checkbox" checked={f.delivery} onChange={set("delivery")}/> Deliver to me (KES 300). Untick to collect in store.</label>
  {f.delivery&&<label>Delivery address<input value={f.address} onChange={set("address")}/></label>}
  <h3>Order summary</h3>{lines.length?lines.map(([id,q])=><div className="sum" key={id}><span>{q} × {PRODUCTS[id].name}</span><span>{kes(PRODUCTS[id].price*q)}</span></div>):<p className="empty">Your trolley is empty.</p>}
  <p>Subtotal {kes(sub)}<br/>Delivery {kes(fee)}<br/><b className="big">Total {kes(sub+fee)}</b></p>
  <button className="btn w" disabled={busy||!lines.length} onClick={pay}>{busy?"Sending…":DEMO?"Pay with M-Pesa (demo)":"Pay with M-Pesa"}</button><button className="btn s w" onClick={closeAll}>Back to shopping</button></>}</div></div>)}
