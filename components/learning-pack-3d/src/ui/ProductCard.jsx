import { useEffect, useState } from "react";
import { AISLES, availability, gradeLabel, kes } from "../data/catalogue.js";
import { useCart, useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

/** Product details: a floating card on desktop, a bottom sheet on phones. */
export default function ProductCard() {
  const p = useShop((s) => s.selected);
  return p ? <Card key={p.id} p={p} /> : null;
}

function Card({ p }) {
  const add = useShop((s) => s.add);
  const close = useShop((s) => s.closeAll);
  const setPanel = useShop((s) => s.setPanel);
  const say = useShop((s) => s.say);
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [close]);

  const aisle = p.isBundle ? 7 : p.aisle;
  const stock = availability(p);
  const inTrolley = p.isBundle ? 0 : cart.lines.find((l) => l.variantId === p.variantId)?.quantity || 0;

  return (
    <aside className="pcard" role="dialog" aria-label={p.name}>
      <button className="x" onClick={close} aria-label="Close product details">
        <Icon name="x" />
      </button>
      <Thumb product={p} className="pc-img" />
      <div className="pc-body">
        <div className="pc-brand">
          {p.brand}
          {aisle >= 0 && <> · Aisle {aisle + 1} · {AISLES[aisle].name}</>}
        </div>
        <h3>{p.name}</h3>
        <div className="pc-meta">
          <span className="tag">{gradeLabel(p)}</span>
          <span className={"tag stock " + stock.tone}>{p.isBundle ? "Bundle" : stock.text}</span>
        </div>
        {p.isBundle && (
          <ul className="pc-items">
            {p.items.map((i) => (
              <li key={i.id}>
                <span>{i.name}</span>
                <b>{kes(i.price)}</b>
              </li>
            ))}
          </ul>
        )}
        <div className="pc-price">{kes(p.price)}</div>
        <div className="pc-actions">
          <span className="qty" role="group" aria-label="Quantity">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Icon name="minus" /></button>
            <b aria-live="polite">{qty}</b>
            <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity"><Icon name="plus" /></button>
          </span>
          {p.unavailable ? (
            <button className="lp-btn" disabled aria-disabled="true"><Icon name="warn" /> Unavailable</button>
          ) : added ? (
            <button className="lp-btn navy" onClick={() => setPanel("cart")}>
              <Icon name="check" /> Added · View trolley
            </button>
          ) : (
            <button
              className="lp-btn"
              onClick={() => {
                add(p, qty);
                setAdded(true);
                say(`Added ${qty} × ${p.name}`);
              }}
            >
              <Icon name="cart" /> Add to Trolley
            </button>
          )}
        </div>
        {inTrolley > 0 && !added && <div className="pc-note"><Icon name="check" /> {inTrolley} already in your trolley</div>}
      </div>
    </aside>
  );
}
