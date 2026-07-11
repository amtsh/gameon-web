"use client";

import { Clock, Crown, MapPin } from "lucide-react";
import clsx from "clsx";
import { memo } from "react";
import { sports } from "../data/mock-data";
import { clockTime, durationText, eventRelativeLabel, eventTime, spotsLeft } from "../event-feed";
import type { SportEvent } from "../types";

type Props = {
  event: SportEvent;
  isArchived?: boolean;
  onSelect: () => void;
};

export function SpotsLeftBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} spots left`}
      className={clsx("spots-badge", count <= 2 && "low")}
    >
      <span className="count">{count}</span>
      <span className="label">spots</span>
    </span>
  );
}

export function HostedByYouBadge() {
  return (
    <span className="status-badge host">
      <Crown fill="currentColor" size={11} />
      Hosted by you
    </span>
  );
}

export const EventRow = memo(function EventRow({
  event,
  isArchived = false,
  onSelect,
}: Props) {
  const sport = sports.find((candidate) => candidate.id === event.sport);
  const startTime = isArchived
    ? `Ended ${clockTime(new Date(event.endsAt))}`
    : eventTime(new Date(event.startsAt));

  return (
    <button className="event-row" onClick={onSelect}>
      <SpotsLeftBadge count={spotsLeft(event)} />

      <span className="min-w-0 flex-1">
        <span className="row-meta">
          {sport?.label}
          <span style={{ color: "var(--label-text)" }}>·</span>
          <span>{eventRelativeLabel(event)}</span>
        </span>

        <span className="row-title">{event.title}</span>

        <span className="row-meta mt-1">
          <MapPin size={12} />
          <span className="truncate">
            {event.venue.name || event.venue.address || "Venue"}
          </span>
        </span>

        <span className="row-meta mt-1">
          <Clock size={12} />
          {startTime}
          <span style={{ color: "var(--label-text)" }}>·</span>
          <span style={{ color: "var(--primary-text)" }}>
            {durationText(event)}
          </span>
        </span>

        {rowBadges(event, isArchived)}
      </span>
    </button>
  );
});

function rowBadges(event: SportEvent, isArchived: boolean) {
  const badges: React.ReactNode[] = [];

  if (event.isCreatedByCurrentUser) {
    badges.push(<HostedByYouBadge key="host" />);
  }
  if (isArchived) {
    badges.push(
      <span className="status-badge archived" key="archived">
        Archived
      </span>,
    );
  }

  if (event.isCreatedByCurrentUser) {
    if ((event.pendingRequestCount ?? 0) > 0) {
      badges.push(
        <span className="status-badge danger" key="pending-count">
          {event.pendingRequestCount} pending requests
        </span>,
      );
    }
  } else if (event.isJoined) {
    badges.push(
      <span className="status-badge success" key="going">
        You are going
      </span>,
    );
  } else if (event.hasPendingRequest) {
    badges.push(
      <span className="status-badge warning" key="waiting">
        Waiting for approval
      </span>,
    );
  }

  if (badges.length === 0) return null;
  return <span className="row-badges">{badges}</span>;
}
