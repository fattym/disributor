"use client";

import { startTransition, useEffect, useState } from "react";

const getSavedTheme = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("theme");
};

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = getSavedTheme();
    const light = savedTheme === "light";
    document.documentElement.classList.toggle("light-mode", light);
    document.documentElement.classList.toggle(
      "dark-mode",
      savedTheme === "dark",
    );
    startTransition(() => setIsLight(light));
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    document.documentElement.classList.toggle("light-mode", nextIsLight);
    document.documentElement.classList.toggle("dark-mode", !nextIsLight);
    window.localStorage.setItem("theme", nextIsLight ? "light" : "dark");
    setIsLight(nextIsLight);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
    >
      {isLight ? "Dark mode" : "Light mode"}
    </button>
  );
}
