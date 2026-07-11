"use client";

import { Moon, Navigation, Plus, Sun } from "lucide-react";
import { setTheme, useTheme } from "../theme";

type Props = {
  onCreate: () => void;
  onLocate: () => void;
};

export function FloatingActions({ onCreate, onLocate }: Props) {
  const theme = useTheme();

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
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}
