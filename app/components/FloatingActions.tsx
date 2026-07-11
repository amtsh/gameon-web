"use client";

import { Moon, Navigation, Sun } from "lucide-react";
import { setTheme, useTheme } from "../theme";

type Props = {
  onLocate: () => void;
};

export function FloatingActions({ onLocate }: Props) {
  const theme = useTheme();

  return (
    <div className="floating-actions" aria-label="Map actions">
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
