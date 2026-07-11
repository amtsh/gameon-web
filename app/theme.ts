"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const THEME_EVENT = "gameon-themechange";

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

// The layout's pre-paint script sets data-theme before hydration.
function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => "light");
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("gameon-theme", theme);
  } catch {
    // Private browsing — theme just won't persist.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
