"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import CartCount from "./CartCount";
import { MAIN_NAV, TRACK_ORDER } from "@/lib/nav";
import { LOGO_SVG } from "./logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import "./site-header.css";

const Icon = ({ d }: { d: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const CART = "M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20.5 8H6M9 20h.01M18 20h.01";
const SEARCH = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20.5 20.5 16 16";
const MENU = "M4 7h16M4 12h16M4 17h16";
const CLOSE = "M6 6l12 12M18 6 6 18";

export default function GlobalHeader() {
  const drawer = useRef<HTMLDialogElement>(null);
  const pathname = usePathname() || "";
  const current = (href: string) => (`${pathname.replace(/\/$/, "")}/`.startsWith(href) ? "page" : undefined);
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const showMyOrders = user && user.role !== "DISTRIBUTOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN";
  const links = showMyOrders ? [...MAIN_NAV, { href: "/orders/", label: "My Orders" }] : MAIN_NAV;
  const close = () => drawer.current?.close();

  // The drawer belongs to the phone layout only.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const shut = () => { if (wide.matches) drawer.current?.close(); };
    wide.addEventListener("change", shut);
    return () => wide.removeEventListener("change", shut);
  }, []);

  return (
    <div className="lph">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <div className="lph__wrap lph__top">
          <Link href="/" className="lph__logo" aria-label="Learning Pack home">
            <span dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          </Link>
          <form className="lph__search" role="search" action="/shop" method="get">
            <input type="search" name="q" placeholder="Search books and stationery" aria-label="Search products" />
            <button type="submit" aria-label="Search">
              <Icon d={SEARCH} />
            </button>
          </form>
          <div className="lph__actions">
            <Link href={TRACK_ORDER.href} className="lph__track" aria-current={current(TRACK_ORDER.href)}>
              {TRACK_ORDER.label}
            </Link>
            <ThemeToggle variant="icon" className="lph__icon lph__theme" />
            <Link href="/cart" className="lph__icon lph__cart" aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
              <span className="cart-icon-wrap">
                <Icon d={CART} />
                <CartCount />
              </span>
            </Link>
            <button type="button" className="lph__icon lph__menu" aria-label="Open menu" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}>
              <Icon d={MENU} />
            </button>
          </div>
        </div>
        <nav className="lph__nav" aria-label="Main">
          <div className="lph__wrap">
            <ul>
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={current(item.href)}>{item.label}</Link>
                </li>
              ))}
            </ul>
            <Link href="/login" className="lph__login">Log in</Link>
          </div>
        </nav>
      </header>

      <dialog
        ref={drawer}
        className="lph__drawer"
        aria-label="Menu"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="lph__panel">
          <button type="button" className="lph__icon lph__close" aria-label="Close menu" onClick={close}>
            <Icon d={CLOSE} />
          </button>
          <nav aria-label="Menu links">
            <ul>
              {[...links, TRACK_ORDER, { href: "/login", label: "Log in" }].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={current(item.href)} onClick={close}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle className="lph__drawer-theme" />
          <a className="lph__whatsapp" href="https://wa.me/254716815025" target="_blank" rel="noopener noreferrer">
            WhatsApp 0716 815 025
          </a>
        </div>
      </dialog>
    </div>
  );
}
