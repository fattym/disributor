import { useState } from "react";
import { AISLES } from "../data/catalogue.js";
import Icon from "./Icon.jsx";

/** Product picture with a graceful fallback (aisle-coloured tile) when there is no image or it fails. */
export default function Thumb({ product, className = "" }) {
  const [bad, setBad] = useState(false);
  const aisle = product.isBundle ? 7 : Math.max(0, product.aisle ?? 0);
  const def = AISLES[aisle];
  if (product.isBundle) {
    const shots = product.items.filter((i) => i.image).slice(0, 4);
    return (
      <span className={"thumb bundle " + className} style={{ "--tint": def.color }}>
        {shots.length ? shots.map((i) => <img key={i.id} src={i.image} alt="" decoding="async" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />) : <Icon name="gift" />}
      </span>
    );
  }
  if (!product.image || bad) {
    return (
      <span className={"thumb fallback " + className} style={{ "--tint": def.color }}>
        <Icon name={def.icon} />
      </span>
    );
  }
  return (
    <span className={"thumb " + className}>
      <img src={product.image} alt="" decoding="async" onError={() => setBad(true)} />
    </span>
  );
}
