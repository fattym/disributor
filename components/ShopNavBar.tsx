"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { navigationData } from "@/lib/shopCategories";
import "./shop-nav.css";

export default function ShopNavBar() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (slug: string) => {
    setOpenCategory(slug);
  };

  const handleMouseLeave = () => {
    setOpenCategory(null);
  };

  const toggleCategory = (slug: string) => {
    setOpenCategory(openCategory === slug ? null : slug);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenCategory(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openNav = navigationData.find((c) => c.slug === openCategory);

  return (
    <nav
      ref={navRef}
      className="shop-nav"
      aria-label="Shop categories"
    >
      <div className="shop-nav__wrap wrap">
        <ul className="shop-nav__top">
          {navigationData.map((cat) => (
            <li
              key={cat.slug}
              className={`shop-nav__item ${
                openCategory === cat.slug ? "is-open" : ""
              }`}
              onMouseEnter={() => handleMouseEnter(cat.slug)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className="shop-nav__trigger"
                aria-haspopup="menu"
                aria-expanded={openCategory === cat.slug}
                onClick={() => toggleCategory(cat.slug)}
              >
                <span>{cat.label}</span>
                <span className="shop-nav__chevron" aria-hidden="true"></span>
              </button>

              {openCategory === cat.slug && openNav && (
                <div
                  className="shop-nav__dropdown"
                  role="menu"
                  aria-label={`${cat.label} submenu`}
                >
                  <div className="shop-nav__dropdown-head">
                    <span className="shop-nav__dropdown-title">{cat.label}</span>
                    <button
                      type="button"
                      className="shop-nav__close"
                      onClick={() => setOpenCategory(null)}
                      aria-label="Close menu"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                  <div className="shop-nav__columns">
                    {openNav.groups.map((group) => (
                      <div key={group.label} className="shop-nav__group">
                        <h3 className="shop-nav__group-title">{group.label}</h3>
                        <ul className="shop-nav__sublist">
                          {group.items.map((item) => (
                            <li key={item.href}>
                              <Link href={item.href} role="menuitem">
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
