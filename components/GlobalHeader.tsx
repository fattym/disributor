"use client";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { MAIN_NAV } from "@/lib/nav";
import { LOGO_SVG } from "./logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const CART_SVG =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20.5 8H6"/></svg>';

export default function GlobalHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() || "";
  const isCurrent = (href: string) => `${pathname.replace(/\/$/, "")}/`.startsWith(href);
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const showMyOrders = user && user.role !== "DISTRIBUTOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN";
  return (
    <div>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="topbar">
        <div className="wrap">
          <p>
            <a href="tel:0798734442">0798 734 442</a> /{" "}
            <a href="tel:0716815025">0716 815 025</a> &nbsp;Mon–Fri, 8am to 6pm
          </p>
          <ul>
            <li>
              <a href="/track-your-order/">Track your order</a>
            </li>
            <li>
              <a href="/supplier-portal">Supplier portal</a>
            </li>
            <li>
              <a href="/contact/">Help</a>
            </li>
            <li>
              <a href="/login">Log in</a>
            </li>
          </ul>
        </div>
      </div>

      <header className="header">
        <div className="wrap header__top">
          <div className="header__left">
            <button
              className="menu-btn"
              id="menuBtn"
              aria-expanded={menuOpen}
              aria-controls="nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Menu
            </button>
            <form className="search" role="search" action="/shop" method="get">
              <input
                type="search"
                name="q"
                placeholder="Search"
                aria-label="Search products"
              />
              <input type="hidden" name="post_type" value="product" />
              <button type="submit">Search</button>
            </form>
          </div>
          <Link href="/" className="logo" aria-label="Learning Pack home">
            <span dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          </Link>
          <div className="header__right">
            <ThemeToggle />
            <Link href="/cart" className="cart" aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
              <span className="cart-icon-wrap">
                <span dangerouslySetInnerHTML={{ __html: CART_SVG }} />
                {cartCount > 0 && <span className="cart-count-badge">{cartCount > 99 ? "99+" : cartCount}</span>}
              </span>
              <span className="cart-label">Cart</span>
            </Link>
          </div>
        </div>
        <nav
          className={menuOpen ? "nav is-open" : "nav"}
          id="nav"
          aria-label="Main"
        >
          <div className="wrap">
            <ul>
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>{item.label}</Link>
                </li>
              ))}
              {showMyOrders && (
                <li>
                  <Link href="/orders" aria-current={isCurrent("/orders/") ? "page" : undefined}>My Orders</Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>
    </div>
  );
}
