"use client";

import { Icon } from "@iconify/react";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  Gauge,
  MapPin,
  User,
  Users,
} from "lucide-react";
import { sports } from "../data/mock-data";
import {
  clockTime,
  detailDate,
  isArchived,
  spotsLeft,
} from "../event-feed";
import { HostedByYouBadge, SpotsLeftBadge } from "./EventRow";
import type { SportEvent } from "../types";

type Props = {
  event: SportEvent;
  onClose: () => void;
};

const skillLevelLabels: Record<SportEvent["skillLevel"], string> = {
  any: "Any level",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function EventDetailSheet({ event, onClose }: Props) {
  const sport = sports.find((candidate) => candidate.id === event.sport);
  const spots = spotsLeft(event);
  const archived = isArchived(event);

  const dateTimeText = `${detailDate(new Date(event.startsAt))} · ${clockTime(
    new Date(event.startsAt),
  )} - ${clockTime(new Date(event.endsAt))}`;

  const venueSubtitle = [
    [event.venue.address, event.venue.city].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue.name}, ${event.venue.city ?? ""}`,
  )}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="detail-sheet"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="detail-scroll">
          <div className="sheet-grabber" style={{ marginTop: -16 }} />

          {/* Header: spots badge, sport meta, title, status pills */}
          <div className="flex items-center gap-3.5">
            <SpotsLeftBadge count={spots} />
            <div className="min-w-0 flex-1">
              <p className="row-meta" style={{ fontWeight: 700, fontSize: 10 }}>
                <Icon icon={sport?.icon ?? "mdi:trophy"} width={12} />
                {sport?.label}
              </p>
              <h2 className="detail-title mt-2">{event.title}</h2>
              <div className="row-badges">
                {event.isCreatedByCurrentUser ? <HostedByYouBadge /> : null}
                {event.isJoined && !event.isCreatedByCurrentUser ? (
                  <span className="status-badge success">You are going</span>
                ) : null}
                {event.hasPendingRequest ? (
                  <span className="status-badge warning">Pending request</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* When / Where */}
          <div className="mt-6 flex items-center gap-3.5">
            <span className="detail-icon-tile">
              <Calendar size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="detail-label">When</p>
              <p className="detail-body mt-1.5">{dateTimeText}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3.5">
            <span className="detail-icon-tile">
              <MapPin size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="detail-label">Where</p>
              <p className="detail-body mt-1.5">{event.venue.name}</p>
              {venueSubtitle ? (
                <p className="detail-caption mt-1">{venueSubtitle}</p>
              ) : null}
              <a
                className="link-info mt-1.5"
                href={mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open in Maps
                <ChevronRight size={14} strokeWidth={3} />
              </a>
            </div>
          </div>

          <hr className="detail-divider my-6" />

          {/* Players / Level */}
          <div className="flex gap-4 pl-[17px]">
            <MetadataItem
              icon={<Users size={12} />}
              label="Players"
              value={`${event.joinedCount} / ${event.capacity} players`}
            />
            <MetadataItem
              icon={<Gauge size={12} />}
              label="Level"
              value={skillLevelLabels[event.skillLevel]}
            />
          </div>

          <hr className="detail-divider my-6" />

          {/* Cost / Host */}
          <div className="flex gap-4 pl-[17px]">
            <MetadataItem
              icon={<CreditCard size={12} />}
              label="Cost"
              value={event.cost?.trim() || "Not mentioned"}
            />
            <MetadataItem
              icon={<User size={12} />}
              label="Host"
              value={event.isCreatedByCurrentUser ? "You" : event.hostName ?? "Host"}
            />
          </div>

          {/* Host contact (visible when joined, mirrors iOS gating) */}
          {event.hostContact && event.isJoined && !event.isCreatedByCurrentUser ? (
            <>
              <hr className="detail-divider my-6" />
              <div className="pl-[66px]">
                <p className="detail-label">Host contact</p>
                <div className="mt-2 flex items-center gap-3">
                  <Icon
                    className="text-[var(--muted-icon)]"
                    icon={
                      event.hostContact.method === "telegram"
                        ? "mdi:telegram"
                        : "mdi:whatsapp"
                    }
                    width={20}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="detail-caption" style={{ fontWeight: 700 }}>
                      {event.hostName ?? "Host"} on{" "}
                      {event.hostContact.method === "telegram"
                        ? "Telegram"
                        : "WhatsApp"}
                    </p>
                    <p className="detail-body">{event.hostContact.value}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {/* Requests (own games) */}
          {event.isCreatedByCurrentUser && !archived ? (
            <>
              <hr className="detail-divider my-6" />
              <div>
                <p className="detail-label">Requests</p>
                {(event.pendingRequestCount ?? 0) > 0 ? (
                  <PendingRequestRows count={event.pendingRequestCount ?? 0} />
                ) : (
                  <p className="detail-body mt-2">No pending requests</p>
                )}
                <button className="outline-action mt-4">
                  Edit game details
                </button>
              </div>
            </>
          ) : null}

          {/* Description */}
          {event.description ? (
            <div className="mt-6 pl-[66px]">
              <p className="detail-label">Description</p>
              <p className="detail-body mt-1.5">{event.description}</p>
            </div>
          ) : null}

          {event.isJoined && !event.isCreatedByCurrentUser && !archived ? (
            <button className="text-danger-action mt-4">Leave game</button>
          ) : null}
        </div>

        {/* Bottom action (participants + archived games) */}
        {archived || !event.isCreatedByCurrentUser ? (
          <div className="detail-bottom">
            {archived ? (
              <p className="empty-state pb-3 pt-0 text-center">
                Archived game
              </p>
            ) : null}
            {archived || event.isJoined ? (
              <a
                className="primary-action grid place-items-center"
                href={mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Get Directions
              </a>
            ) : (
              <button
                className={
                  event.hasPendingRequest
                    ? "primary-action danger"
                    : "primary-action"
                }
                disabled={spots === 0 && !event.hasPendingRequest}
              >
                {event.hasPendingRequest
                  ? "Withdraw request"
                  : spots === 0
                    ? "Game full"
                    : "Request to join"}
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MetadataItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="metadata-item">
      <p className="meta-label">
        {icon}
        {label}
      </p>
      <p className="meta-value">{value}</p>
    </div>
  );
}

const mockRequesters = [
  { name: "Lukas", level: "Intermediate" },
  { name: "Priya", level: "Advanced" },
];

function PendingRequestRows({ count }: { count: number }) {
  return (
    <div>
      {mockRequesters.slice(0, count).map((requester) => (
        <div
          className="flex items-center gap-3 border-b border-[var(--hairline)] py-3"
          key={requester.name}
        >
          <div className="min-w-0 flex-1">
            <p className="detail-body" style={{ fontWeight: 600 }}>
              {requester.name}
            </p>
            <p className="detail-caption mt-1">
              {requester.level} · Pending
            </p>
          </div>
          <button className="approve-pill">Approve</button>
        </div>
      ))}
    </div>
  );
}
