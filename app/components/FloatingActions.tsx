"use client";

import { Navigation, Plus } from "lucide-react";

type Props = {
  onCreate: () => void;
  onLocate: () => void;
};

export function FloatingActions({ onCreate, onLocate }: Props) {
  return (
    <div className="floating-actions" aria-label="Map actions">
      <button aria-label="Create Game" onClick={onCreate}>
        <Plus size={21} />
      </button>
      <span />
      <button aria-label="Current location" onClick={onLocate}>
        <Navigation size={19} style={{ transform: "rotate(-3deg)" }} />
      </button>
    </div>
  );
}
