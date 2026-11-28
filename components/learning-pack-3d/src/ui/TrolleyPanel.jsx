import { DELIVERY_NOTE } from '@/lib/shopText';
import { kes } from "../data/catalogue.js";
import { useCart, useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

export default function TrolleyPanel() {
  const open = useShop((s) => s.panel === "cart");
  const setPanel = useShop((s) => s.setPanel);
  const closeAll = useShop((s) => s.closeAll);
  const setQuantity = useShop((s) => s.setQuantity);
  const remove = useShop((s) => s.remove);
  const goTo = useShop((s) => s.goTo);
  const cart = useCart();

  return (
    <aside className={"panel" + (open ? " on" : "")} inert={!open} aria-label="Your trolley">
      <header className="p-head">
        <h2><Icon name="cart" /> Your Trolley <small>{cart.count} item{cart.count === 1 ? "" : "s"}</small></h2>
        <button className="icon-btn sm" onClick={closeAll} aria-label="Close trolley"><Icon name="x" /></button>
      </header>
      <div className="p-body">
        {cart.lines.length ? (
          <ul className="lines">
            {cart.lines.map(({ variantId, quantity, product, subtotal }) => (
              <li key={variantId} className="line">
                <button className="l-thumb" onClick={() => !product.unresolved && goTo(product)} aria-label={`Find ${product.name} on the shelf`}>
                  <Thumb product={product} />
                </button>
                <div className="l-main">
                  <b>{product.name}</b>
                  <small>{product.unresolved ? "Added elsewhere in the shop" : `${kes(product.price)} each`}</small>
                  <div className="l-row">
                    <span className="qty sm" role="group" aria-label={`Quantity of ${product.name}`}>
                      <button onClick={() => setQuantity(variantId, quantity - 1)} aria-label="Decrease quantity"><Icon name="minus" /></button>
                      <b>{quantity}</b>
                      <button onClick={() => setQuantity(variantId, quantity + 1)} aria-label="Increase quantity"><Icon name="plus" /></button>
                    </span>
                    <button className="link danger" onClick={() => remove(variantId)} aria-label={`Remove ${product.name}`}>
                      <Icon name="trash" /> Remove
                    </button>
                  </div>
                </div>
                <b className="l-total">{kes(subtotal)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <div className="lp-empty">
            <Icon name="cart" />
            <b>Your trolley is empty</b>
            <p>Click any product on a shelf, or open your child’s booklist to add everything they need.</p>
            <button className="lp-btn ghost" onClick={() => setPanel("booklist")}><Icon name="list" /> Open booklist</button>
          </div>
        )}
      </div>
      <footer className="p-foot">
        <div className="sum-row big"><span>Subtotal</span><b>{kes(cart.subtotal)}</b></div>
        <p className="note"><Icon name="truck" /> {DELIVERY_NOTE}</p>
        <div className="p-actions">
          <button className="lp-btn ghost" onClick={closeAll}>Continue Shopping</button>
          <button className="lp-btn" disabled={!cart.lines.length} onClick={() => window.location.assign("/cart/")}>Proceed to Checkout</button>
        </div>
      </footer>
    </aside>
  );
}
