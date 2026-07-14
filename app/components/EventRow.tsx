"use client";

import { Icon } from "@iconify/react";
import { Clock, Crown, Lock, MapPin } from "lucide-react";
import clsx from "clsx";
import { memo } from "react";
import { sports } from "../data/mock-data";
import {
  clockTime,
  countdownUrgency,
  durationText,
  eventRelativeLabel,
  isCancelled,
  shortDateSuffix,
  spotsLeft,
  weekdayLabel,
} from "../event-feed";
import { eventScheduleKind } from "@/lib/datetime/display";
import { formatDistanceKm } from "@/lib/location/geo";
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

export function PrivateBadge() {
  return (
    <span className="status-badge private">
      <Lock aria-hidden size={11} strokeWidth={2.25} />
      Private
    </span>
  );
}

const URGENCY_COLOR: Record<"urgent" | "hours", string> = {
  urgent: "var(--danger)",
  hours: "var(--warning)",
};

type EventCountdownMetaProps = {
  event: SportEvent;
  isArchived?: boolean;
  sportLabel?: string;
  sportIcon?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function EventCountdownMeta({
  event,
  isArchived = false,
  sportLabel,
  sportIcon,
  className,
  style,
}: EventCountdownMetaProps) {
  const urgency = isArchived ? null : countdownUrgency(event);
  const countdownColor = urgency ? URGENCY_COLOR[urgency] : undefined;

  return (
    <span className={clsx("row-meta", className)} style={style}>
      {sportIcon ? <Icon icon={sportIcon} width={12} /> : null}
      {sportLabel}
      {sportLabel ? (
        <span style={{ color: "var(--label-text)" }}>·</span>
      ) : null}
      <span
        style={{
          color: countdownColor,
          fontWeight: urgency ? 600 : undefined,
        }}
      >
        {eventRelativeLabel(event)}
      </span>
    </span>
  );
}

function EventCountdown({
  event,
  isArchived = false,
}: {
  event: SportEvent;
  isArchived?: boolean;
}) {
  const urgency = isArchived ? null : countdownUrgency(event);
  const countdownColor = urgency ? URGENCY_COLOR[urgency] : undefined;

  return (
    <span
      className="row-countdown"
      style={{
        color: countdownColor,
        fontWeight: urgency ? 600 : undefined,
      }}
    >
      {eventRelativeLabel(event)}
    </span>
  );
}

function ScheduleDate({ date }: { date: Date }) {
  return (
    <>
      <span className="row-schedule-day">{weekdayLabel(date)}</span>
      <span className="row-schedule-muted">{shortDateSuffix(date)}</span>
    </>
  );
}

function EventRowSchedule({
  event,
  isArchived = false,
}: {
  event: SportEvent;
  isArchived?: boolean;
}) {
  const kind = eventScheduleKind(event.startsAt, event.endsAt, { isArchived });

  switch (kind.type) {
    case "archived":
      return (
        <span className="row-meta-text">
          <span className="row-schedule-muted">Ended </span>
          <ScheduleDate date={kind.end} />
          <span className="row-meta-sep"> · </span>
          <span className="row-schedule-muted">{clockTime(kind.end)}</span>
        </span>
      );
    case "same-day":
      return (
        <span className="row-meta-text">
          <ScheduleDate date={kind.start} />
          <span className="row-meta-sep"> · </span>
          <span className="row-schedule-muted">
            {clockTime(kind.start)} – {clockTime(kind.end)}
          </span>
        </span>
      );
    case "multi-day":
      return (
        <span className="row-meta-text">
          <ScheduleDate date={kind.start} />
          <span className="row-meta-sep"> · </span>
          <span className="row-schedule-muted">{clockTime(kind.start)}</span>
          <span className="row-meta-sep"> – </span>
          <ScheduleDate date={kind.end} />
          <span className="row-meta-sep"> · </span>
          <span className="row-schedule-muted">{clockTime(kind.end)}</span>
        </span>
      );
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export const EventRow = memo(function EventRow({
  event,
  isArchived = false,
  onSelect,
}: Props) {
  const sport = sports.find((candidate) => candidate.id === event.sport);

  return (
    <button className="event-row" onClick={onSelect} type="button">
      <SpotsLeftBadge count={spotsLeft(event)} />

      <div className="event-row-body">
        <div className="row-header">
          <div className="row-sport-label">
            {sport?.icon ? <Icon icon={sport.icon} width={12} /> : null}
            <span className="row-sport-name">{sport?.label}</span>
            <span className="row-meta-sep">·</span>
            <span className="row-sport-duration">{durationText(event)}</span>
          </div>
          <EventCountdown event={event} isArchived={isArchived} />
        </div>

        <div className="row-title">{event.title}</div>

        <div className="row-meta">
          <MapPin aria-hidden size={12} />
          <span className="row-meta-text">
            {event.venue.name || event.venue.address || "Venue"}
            {event.distanceKm != null
              ? ` · ${formatDistanceKm(event.distanceKm)}`
              : ""}
          </span>
        </div>

        <div className="row-meta row-meta-schedule">
          <Clock aria-hidden size={12} />
          <EventRowSchedule event={event} isArchived={isArchived} />
        </div>

        {rowBadges(event, isArchived)}
      </div>
    </button>
  );
});

function rowBadges(event: SportEvent, isArchived: boolean) {
  const badges: React.ReactNode[] = [];

  if (event.isCreatedByCurrentUser) {
    badges.push(<HostedByYouBadge key="host" />);
  }
  if (event.isPrivate) {
    badges.push(<PrivateBadge key="private" />);
  }
  if (isArchived) {
    badges.push(
      <span className="status-badge archived" key="archived">
        Archived
      </span>,
    );
  }

  if (isCancelled(event)) {
    badges.push(
      <span className="status-badge cancelled" key="cancelled">
        Cancelled
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
    if (!isCancelled(event)) {
      badges.push(
        <span className="status-badge success" key="going">
          You are going
        </span>,
      );
    }
    if (!isArchived && !isCancelled(event)) {
      const contactIcon =
        event.hostContact?.method === "telegram"
          ? "mdi:telegram"
          : event.hostContact?.method === "whatsapp"
            ? "mdi:whatsapp"
            : "mdi:chat";

      badges.push(
        <span className="status-badge message" key="message-host">
          <Icon icon={contactIcon} width={11} />
          Message Host
        </span>,
      );
    }
  } else if (event.hasPendingRequest) {
    badges.push(
      <span className="status-badge warning" key="waiting">
        Waiting for approval
      </span>,
    );
  } else if (event.isOnWaitlist) {
    badges.push(
      <span className="status-badge warning" key="waitlist">
        On waitlist
      </span>,
    );
  }

  if (badges.length === 0) return null;
  return <span className="row-badges">{badges}</span>;
}
