import {PRODUCTS,kes} from "../data/catalogue.js";import {useShop,cartTotal} from "../store/useShop.js";
export default function TrolleyPanel(){const {cart,panel,add,remove,setPanel,closeAll}=useShop(),ids=Object.keys(cart);
 return(<aside className={"panel glass"+(panel==="cart"?" on":"")} aria-hidden={panel!=="cart"}><h2>🛒 Your Trolley</h2>
  {ids.length?ids.filter(i=>PRODUCTS[i]).map(i=>{const p=PRODUCTS[i];return(<div className="row line" key={i}><div className="sw" style={{background:p.color+"33"}}>{p.icon}</div>
   <div className="grow"><b>{p.name}</b><small>{kes(p.price)} each</small><span className="qty"><button onClick={()=>add(+i,-1)}>−</button>{cart[i]}<button onClick={()=>add(+i,1,true)}>+</button><button onClick={()=>remove(i)} aria-label="Remove">🗑</button></span></div></div>)})
   :<p className="empty">Your trolley is empty. Click any book on a shelf to add it.</p>}
  <h3>Subtotal: {kes(cartTotal(cart))}</h3><p className="small">Delivery within Nairobi in 1–2 days (KES 300), or collect free in store.</p>
  <button className="btn w ghost" onClick={closeAll}>Continue Shopping</button><button className="btn w" disabled={!ids.length} onClick={()=>setPanel("checkout")}>Proceed to Checkout</button></aside>)}
