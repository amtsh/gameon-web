"use client";

import { ChevronLeft, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchApprovedPlayers,
  type ApprovedPlayer,
} from "@/lib/data/join-requests.client";
import { formatGamesPlayed } from "@/lib/data/game-count-copy";
import { ModalSheet, ModalSheetScroll } from "./ModalSheet";
import type { SkillLevel } from "../types";
import "./PlayersSheet.css";

const levelLabel: Record<SkillLevel, string> = {
  any: "Any level",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// CSS class per level — theming handled in PlayersSheet.css
const levelClass: Record<SkillLevel, string> = {
  any: "players-level--any",
  beginner: "players-level--beginner",
  intermediate: "players-level--intermediate",
  advanced: "players-level--advanced",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? "").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function PlayerAvatar({ player }: { player: ApprovedPlayer }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = player.avatarUrl && !imgFailed;

  return (
    <div className="players-avatar" aria-hidden>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="players-avatar-img"
          referrerPolicy="no-referrer"
          src={player.avatarUrl!}
          width={46}
          height={46}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="players-avatar-initials">
          {initials(player.name)}
        </span>
      )}
    </div>
  );
}

type Props = {
  eventId: string;
  hostId?: string;
  shareToken?: string;
  totalCount: number;
  presented: boolean;
  onPresentedChange: (v: boolean) => void;
};

export function PlayersSheet({
  eventId,
  hostId,
  shareToken,
  totalCount,
  presented,
  onPresentedChange,
}: Props) {
  const [players, setPlayers] = useState<ApprovedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!presented) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    fetchApprovedPlayers(eventId, hostId, { shareToken })
      .then((data) => { if (!cancelled) { setPlayers(data); setLoading(false); } })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load players");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [eventId, hostId, presented, shareToken]);

  // Use fetched count when available, fall back to prop
  const displayCount = loading ? totalCount : players.length || totalCount;

  return (
    <ModalSheet
      height="92svh"
      title="Players joined"
      variant="form"
      scroll={false}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      {/* Sticky nav bar */}
      <div className="players-nav">
        <button
          aria-label="Close"
          className="players-nav-back"
          type="button"
          onClick={() => onPresentedChange(false)}
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
        </button>
        <div className="players-nav-center">
          <h2 className="players-nav-title">Players joined</h2>
          <p className="players-nav-count">{displayCount} players</p>
        </div>
        {/* spacer to keep title centred */}
        <span style={{ width: 40 }} />
      </div>

      <ModalSheetScroll>
        {loading ? (
          <div
            className="players-skeleton-list"
            aria-busy="true"
            aria-label="Loading players"
            role="status"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="players-skeleton-row" key={i}>
                <div className="players-skeleton-avatar" />
                <div className="players-skeleton-text">
                  <div className="players-skeleton-name" />
                  <div className="players-skeleton-level" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="players-error" role="alert">{error}</p>
        ) : players.length === 0 ? (
          <p className="players-empty">No approved players yet.</p>
        ) : (
          <ul className="players-list" role="list" aria-label="Players joined">
            {players.map((player) => (
              <li className="players-row" key={player.id}>
                <PlayerAvatar player={player} />
                <div className="players-info">
                  <span className="players-name">{player.firstName}</span>
                  {player.isHost ? (
                    <span className="status-badge host players-host-badge">
                      <Crown fill="currentColor" size={11} />
                      Host
                    </span>
                  ) : (
                    <span
                      className={`players-level ${levelClass[player.level ?? "beginner"]}`}
                    >
                      {levelLabel[player.level ?? "beginner"]}
                    </span>
                  )}
                  {player.gamesPlayed > 0 ? (
                    <span className="sport-stat-meta">
                      {formatGamesPlayed(player.gamesPlayed)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ModalSheetScroll>
    </ModalSheet>
  );
}
