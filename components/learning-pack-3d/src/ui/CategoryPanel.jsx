import { useState } from "react";
import { AISLES } from "../data/catalogue.js";
import { useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";

export default function CategoryPanel() {
  const [min, setMin] = useState(false);
  const goToAisle = useShop((s) => s.goToAisle);
  const here = useShop((s) => s.aisleHere);
  const stock = useShop((s) => s.stock);
  return (
    <nav className={"lp-cats" + (min ? " min" : "")} aria-label="Aisles">
      <div className="cats-h">
        <b>Aisles</b>
        <button className="icon-btn sm" onClick={() => setMin(!min)} aria-label={min ? "Expand aisle list" : "Collapse aisle list"} aria-expanded={!min}>
          <Icon name={min ? "right" : "left"} />
        </button>
      </div>
      <ul>
        {AISLES.map((a) => (
          <li key={a.id}>
            <button className={here === a.id ? "on" : ""} onClick={() => goToAisle(a.id)} title={`${a.id + 1}. ${a.long}`} aria-current={here === a.id ? "location" : undefined}>
              <span className="num">{a.id + 1}</span>
              <Icon name={a.icon} />
              <span className="nm">{a.name}</span>
              {stock[a.id].length > 0 && <small>{stock[a.id].length}</small>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
