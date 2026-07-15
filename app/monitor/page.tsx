"use client";

import { useCallback, useEffect, useState } from "react";

const PIN_STORAGE_KEY = "monitor-pin";

type Stats = {
  accounts: number;
  activeGames: number;
  pastGames: number;
  linkLoads: number;
  cancelledGames: number;
};

async function fetchStats(pin: string): Promise<Stats> {
  const res = await fetch("/api/monitor/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Wrong PIN" : "Failed to load stats");
  }
  return res.json();
}

export default function MonitorPage() {
  const [pin, setPin] = useState("");
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback((candidatePin: string) => {
    setLoading(true);
    setError(null);
    fetchStats(candidatePin)
      .then((data) => {
        setStats(data);
        setUnlockedPin(candidatePin);
        sessionStorage.setItem(PIN_STORAGE_KEY, candidatePin);
      })
      .catch((err: Error) => {
        setUnlockedPin(null);
        sessionStorage.removeItem(PIN_STORAGE_KEY);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(PIN_STORAGE_KEY);
    if (!stored) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (!cancelled) load(stored);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [load]);

  if (!unlockedPin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-background)] px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(pin);
          }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="rounded-lg border border-[var(--separator)] bg-[var(--field-surface)] px-4 py-3 text-center text-lg tracking-widest text-[var(--primary-text)] outline-none"
          />
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="rounded-lg bg-[var(--primary-action-bg)] px-4 py-3 text-[var(--primary-action-fg)] disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
          {error && <p className="text-center text-sm text-[var(--danger)]">{error}</p>}
        </form>
      </main>
    );
  }

  const tiles: { label: string; value: number }[] = [
    { label: "Total accounts/users", value: stats?.accounts ?? 0 },
    { label: "Total upcoming/active games", value: stats?.activeGames ?? 0 },
    { label: "Total past games", value: stats?.pastGames ?? 0 },
    { label: "Total loads from shared links", value: stats?.linkLoads ?? 0 },
    { label: "Total cancelled games", value: stats?.cancelledGames ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-[var(--app-background)] px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-[var(--primary-text)]">Monitor</h1>
          <button
            onClick={() => load(unlockedPin)}
            disabled={loading}
            className="text-sm text-[var(--info)] disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex flex-col gap-2">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="flex items-center justify-between rounded-lg border border-[var(--hairline)] bg-[var(--elevated-surface)] px-4 py-3"
            >
              <span className="text-sm text-[var(--secondary-text)]">{tile.label}</span>
              <span className="text-lg font-semibold text-[var(--primary-text)]">
                {tile.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
