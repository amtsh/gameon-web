"use client";

import { Moon, Navigation, Plus, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Props = {
  onCreate: () => void;
  onLocate: () => void;
};

type Theme = "light" | "dark";

const THEME_EVENT = "gameon-themechange";

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

// The layout's pre-paint script sets data-theme before hydration.
function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function FloatingActions({ onCreate, onLocate }: Props) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("gameon-theme", next);
    } catch {
      // Private browsing — theme just won't persist.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <div className="floating-actions" aria-label="Map actions">
      <button aria-label="Create Game" onClick={onCreate}>
        <Plus size={21} />
      </button>
      <span />
      <button aria-label="Current location" onClick={onLocate}>
        <Navigation size={19} style={{ transform: "rotate(-3deg)" }} />
      </button>
      <span />
      <button
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}
