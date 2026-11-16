import { useEffect, useRef } from "react";
import { kes } from "../data/catalogue.js";
import { useShop } from "../store/useShop.js";

/** Follows the pointer while it hovers a shelf product (desktop only; hidden on touch). */
export default function Tooltip() {
  const p = useShop((s) => s.hover);
  const ref = useRef();
  useEffect(() => {
    const move = (e) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 16}px)`;
    };
    addEventListener("pointermove", move);
    return () => removeEventListener("pointermove", move);
  }, []);
  if (!p) return null;
  return (
    <div ref={ref} className="tip" role="tooltip">
      <b>{p.name}</b>
      <span>{kes(p.price)} · click to view</span>
    </div>
  );
}
