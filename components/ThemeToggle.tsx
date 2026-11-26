"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "theme";

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (dark: boolean) => {
  const html = document.documentElement;
  html.classList.toggle("dark", dark);
  html.classList.toggle("dark-mode", dark);
  html.classList.toggle("light-mode", !dark);
};

const initTheme = () => {
  const saved = window.localStorage.getItem(THEME_KEY);
  applyTheme(saved === "dark" ? true : saved === "light" ? false : systemPrefersDark());
};

// The class on <html> is the one source of truth, so every toggle on the page agrees.
const subscribe = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDarkNow = () => document.documentElement.classList.contains("dark");

const icon = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const MOON = "M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z";
const SUN = "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19";

export default function ThemeToggle({ variant = "text", className }: { variant?: "text" | "icon"; className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  useEffect(() => initTheme(), []);

  const toggleTheme = () => {
    applyTheme(!dark);
    window.localStorage.setItem(THEME_KEY, dark ? "light" : "dark");
  };

  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      className={className ?? "theme-toggle"}
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={dark}
      title={variant === "icon" ? label : undefined}
    >
      {variant === "icon" ? icon(dark ? SUN : MOON) : dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
