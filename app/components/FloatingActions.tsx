"use client";

import "./FloatingActions.css";
import { Bug, Moon, Navigation, Sun } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { setTheme, useTheme } from "../theme";

type Props = {
  onLocate: () => void;
};

export function FloatingActions({ onLocate }: Props) {
  const theme = useTheme();

  return (
    <div className="floating-actions" aria-label="Map actions">
      <button
        aria-label="Current location"
        onClick={() => {
          haptic("light");
          onLocate();
        }}
      >
        <Navigation size={19} style={{ transform: "rotate(-3deg)" }} />
      </button>
      <span />
      <a
        aria-label="Report a bug or give feedback"
        href="https://gameon.userjot.com"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Bug size={19} />
      </a>
      <span />
      <button
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => {
          haptic("light");
          setTheme(theme === "dark" ? "light" : "dark");
        }}
      >
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}
