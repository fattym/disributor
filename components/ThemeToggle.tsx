"use client";

import { useEffect, useState, startTransition } from "react";

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
  if (typeof window === "undefined") return false;
  const saved = window.localStorage.getItem(THEME_KEY);
  const dark = saved === "dark" ? true : saved === "light" ? false : systemPrefersDark();
  applyTheme(dark);
  return dark;
};

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const dark = initTheme();
    startTransition(() => setIsLight(!dark));
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    applyTheme(!nextIsLight);
    window.localStorage.setItem(THEME_KEY, nextIsLight ? "light" : "dark");
    setIsLight(nextIsLight);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={!isLight}
    >
      {isLight ? "Dark mode" : "Light mode"}
    </button>
  );
}
