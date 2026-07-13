"use client";

import { ChevronLeft, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchApprovedPlayers,
  type ApprovedPlayer,
} from "@/lib/data/join-requests.client";
import { ModalSheet, ModalSheetScroll } from "./ModalSheet";
import type { SkillLevel } from "../types";
import "./PlayersSheet.css";

const levelLabel: Record<SkillLevel, string> = {
  any: "Any level",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const levelColor: Record<SkillLevel, string> = {
  any: "var(--tertiary-text)",
  beginner: "var(--success)",
  intermediate: "var(--warning)",
  advanced: "var(--danger)",
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

  return (
    <ModalSheet
      height="92svh"
      title="Approved players"
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
          <h2 className="players-nav-title">Approved players</h2>
          <p className="players-nav-count">{totalCount} players</p>
        </div>
        {/* spacer to keep title centred */}
        <span style={{ width: 40 }} />
      </div>

      <ModalSheetScroll>
        {loading ? (
          <div className="players-skeleton-list">
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
          <p className="players-error">{error}</p>
        ) : players.length === 0 ? (
          <p className="players-empty">No approved players yet.</p>
        ) : (
          <ul className="players-list" role="list">
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
                      className="players-level"
                      style={{ color: levelColor[player.level ?? "beginner"] }}
                    >
                      {levelLabel[player.level ?? "beginner"]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ModalSheetScroll>
    </ModalSheet>
  );
}
