import Link from "next/link";
import { useCart, useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";

/** Phone navigation: Browse, Booklist, Trolley, Account. */
export default function BottomNav() {
  const panel = useShop((s) => s.panel);
  const setPanel = useShop((s) => s.setPanel);
  const closeAll = useShop((s) => s.closeAll);
  const cart = useCart();
  const tab = panel === "booklist" ? "booklist" : panel === "cart" || panel === "checkout" ? "cart" : "browse";
  return (
    <nav className="bottom" aria-label="Main">
      <button className={tab === "browse" ? "on" : ""} onClick={closeAll}><Icon name="compass" /><span>Browse</span></button>
      <button className={tab === "booklist" ? "on" : ""} onClick={() => setPanel("booklist")}><Icon name="list" /><span>Booklist</span></button>
      <button className={tab === "cart" ? "on" : ""} onClick={() => setPanel("cart")}>
        <Icon name="cart" /><span>Trolley</span>
        {cart.count > 0 && <b className="badge">{cart.count}</b>}
      </button>
      <Link href="/login"><Icon name="user" /><span>Account</span></Link>
    </nav>
  );
}
