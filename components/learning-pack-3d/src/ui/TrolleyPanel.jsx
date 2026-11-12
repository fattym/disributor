import {PRODUCTS,kes} from "../data/catalogue.js";import {useShop,cartItems} from "../store/useShop.js";import {useSupermarketStore} from "@/lib/store/supermarketStore";
export default function TrolleyPanel(){const {panel,add,remove,setPanel,closeAll}=useShop(),ci=cartItems(),products=useShop(s=>s.products);
  const lines=ci.map(c=>{const p=products.find(pp=>pp.backendId===c.variant_id)||PRODUCTS[c.variant_id];return{...c,p}});
  return(<aside className={"panel glass"+(panel==="cart"?" on":"")} aria-hidden={panel!=="cart"}><h2>🛒 Your Trolley</h2>
  {lines.length?lines.map(c=>{const p=c.p;return(<div className="row line" key={c.variant_id}><div className="sw" style={{background:(p&&p.color?"#2563eb":"#2563eb")+"33"}}>{p&&p.icon?p.icon:"📘"}</div>
   <div className="grow"><b>{p&&p.name?p.name:"Item "+c.variant_id}</b><small>{kes((p&&p.price?p.price:0))*c.quantity} each</small><span className="qty"><button onClick={()=>add(c.variant_id,-1)}>−</button>{c.quantity}<button onClick={()=>add(c.variant_id,1,true)}>+</button><button onClick={()=>remove(c.variant_id)} aria-label="Remove">🗑</button></span></div></div>)})
   :<p className="empty">Your trolley is empty. Click any book on a shelf to add it.</p>}
  <h3>Subtotal: {kes(ci.reduce((a,c)=>{const p=products.find(pp=>pp.backendId===c.variant_id);return a+(p?p.price*c.quantity:0);},0))}</h3><p className="small">Delivery within Nairobi in 1–2 days (KES 300), or collect free in store.</p>
  <button className="btn w ghost" onClick={closeAll}>Continue Shopping</button><button className="btn w" disabled={!lines.length} onClick={()=>setPanel("checkout")}>Proceed to Checkout</button></aside>)}
