import { useMemo, useState } from "react";
import Link from "next/link";
import { AISLES, kes } from "../data/catalogue.js";
import { useCart, useInCart, useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

function Logo() {
  return (
    <Link className="lp-logo" href="/" aria-label="Learning Pack home">
      <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
        <rect width="40" height="40" rx="9" fill="#0B1F3A" />
        <rect x="9" y="8" width="2" height="24" fill="#E63B00" />
        <path d="M15 21l5 5 10-12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Learning <b>Pack</b></span>
    </Link>
  );
}

export default function TopBar() {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const cart = useCart();
  const have = useInCart();
  const catalogue = useShop((s) => s.catalogue);
  const selection = useShop((s) => s.selection);
  const booklist = useShop((s) => s.booklist);
  const goTo = useShop((s) => s.goTo);
  const setPanel = useShop((s) => s.setPanel);
  const status = useShop((s) => s.status);

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const out = [];
    for (const p of catalogue) {
      if (p.aisle < 0) continue;
      const hay = `${p.name} ${p.brand}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        out.push(p);
        if (out.length === 7) break;
      }
    }
    return out;
  }, [q, catalogue]);

  const required = booklist.filter((l) => l.product);
  const done = required.filter((l) => have.has(l.product.variantId)).length;
  const pick = (p) => {
    setQ("");
    setFocused(false);
    goTo(p);
  };

  return (
    <header className="top">
      <Logo />
      <div className="lp-search" role="search">
        <Icon name="search" className="s-ico" />
        <input
          aria-label="Search products"
          placeholder="Search books, stationery or school supplies…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) pick(results[0]);
            if (e.key === "Escape") setQ("");
          }}
          disabled={status === "loading" && !catalogue.length}
        />
        {focused && q.trim() && (
          <ul className="results" role="listbox">
            {results.length ? (
              results.map((p) => (
                <li key={p.id}>
                  <button role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)}>
                    <Thumb product={p} />
                    <span className="r-main">
                      <b>{p.name}</b>
                      <small>{AISLES[p.aisle].name} · Aisle {p.aisle + 1}</small>
                    </span>
                    <span className="r-price">{kes(p.price)}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="r-empty">{status === "ready" ? <>No products match “{q}”.</> : "Still stocking the shelves. Results appear in a moment."}</li>
            )}
          </ul>
        )}
      </div>
      <button className="chip hide-m" onClick={() => setPanel("booklist")} title="Change school and grade">
        <Icon name="pin" /> <span>{selection.school || "Select school"} · {selection.grade}</span>
      </button>
      <button className="chip accent hide-m" onClick={() => setPanel("booklist")}>
        <Icon name="list" /> Booklist
        {required.length > 0 && <b className="lp-count">{done}/{required.length}</b>}
      </button>
      <button className="chip hide-m" onClick={() => setPanel("featured")}>
        <Icon name="star" /> Featured
      </button>
      <button className="chip solid" onClick={() => setPanel("cart")} aria-label={`Trolley, ${cart.count} items`}>
        <Icon name="cart" />
        <span className="hide-s">Trolley</span>
        <b key={cart.count} className="badge">{cart.count}</b>
        {cart.count > 0 && <span className="sub hide-m">{kes(cart.subtotal)}</span>}
      </button>
      <Link className="icon-btn hide-m" href="/login" aria-label="Account" title="Account">
        <Icon name="user" />
      </Link>
    </header>
  );
}
