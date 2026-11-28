import { AISLES, kes } from "../data/catalogue.js";
import { useShop } from "../store/useShop.js";
import { gameUi } from "../game/gameUiStore";
import Thumb from "./Thumb.jsx";

/** Pause-menu search: pick a result to walk to its shelf. */
export default function SearchResults({ query }) {
  const catalogue = useShop((s) => s.catalogue);
  const status = useShop((s) => s.status);
  const goTo = useShop((s) => s.goTo);

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = catalogue
    .filter((p) => p.aisle >= 0 && tokens.every((t) => `${p.name} ${p.brand}`.toLowerCase().includes(t)))
    .slice(0, 20);

  if (!results.length) {
    return <p className="lp-muted">{status === "ready" ? `No products match “${query}”.` : "Still stocking the shelves. Try again in a moment."}</p>;
  }
  return (
    <ul className="results-list">
      {results.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            className="lp-menu-item"
            onClick={() => {
              gameUi.resume();
              goTo(p);
            }}
          >
            <Thumb product={p} />
            <span className="lp-menu-item__text">
              <span className="lp-menu-item__label">{p.name}</span>
              <span className="lp-menu-item__detail">{AISLES[p.aisle].name} · Aisle {p.aisle + 1} · {kes(p.price)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
