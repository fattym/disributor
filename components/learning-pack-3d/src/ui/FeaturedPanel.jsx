import { useEffect, useState } from "react";
import { fetchHeroItems } from "../api.js";
import { kes, normalise } from "../data/catalogue.js";
import { useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

/** Featured products (the backend's hero items) and the store's current promotions. */
export default function FeaturedPanel() {
  const open = useShop((s) => s.panel === "featured");
  const closeAll = useShop((s) => s.closeAll);
  const goTo = useShop((s) => s.goTo);
  const index = useShop((s) => s.index);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open || items.length) return;
    fetchHeroItems().then((raw) => raw && setItems(raw.slice(0, 24).map(normalise)));
  }, [open, items.length]);

  return (
    <aside className={"panel" + (open ? " on" : "")} inert={!open} aria-label="Featured products">
      <header className="p-head">
        <h2><Icon name="star" /> Featured</h2>
        <button className="icon-btn sm" onClick={closeAll} aria-label="Close featured products"><Icon name="x" /></button>
      </header>
      <div className="p-body">
        <div className="promo">
          <b>Back to school</b>
          <span>CBC textbooks, stationery and bundles, with free in-store pickup or delivery across Nairobi.</span>
        </div>
        <ul className="lp-grid">
          {items.map((p) => {
            const shelf = index[p.variantId] || p;
            return (
              <li key={p.id}>
                <button onClick={() => goTo(shelf)}>
                  <Thumb product={p} />
                  <b>{p.name}</b>
                  <small>{kes(p.price)}</small>
                </button>
              </li>
            );
          })}
        </ul>
        {!items.length && <p className="note">Loading featured products…</p>}
      </div>
    </aside>
  );
}
