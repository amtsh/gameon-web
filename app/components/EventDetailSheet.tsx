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
import { useCallback, useEffect, useState } from "react";
import { deleteSportEvent } from "@/lib/data/create-event.client";
import {
  approveJoinRequest,
  fetchPendingJoinRequests,
  leaveEvent,
  requestToJoin,
  withdrawJoinRequest,
  type PendingJoinRequest,
} from "@/lib/data/join-requests.client";
import type { Profile } from "@/lib/data/profile.shared";
import { sportPreferencesMap } from "@/lib/data/profile-mutations.client";
import { sports } from "../data/mock-data";
import {
  clockTime,
  detailDate,
  isArchived,
  spotsLeft,
} from "../event-feed";
import { HostedByYouBadge, SpotsLeftBadge } from "./EventRow";
import { ConfirmDialog, ModalSheet, ModalSheetScroll } from "./ModalSheet";
import type { SportEvent } from "../types";

const destructiveActions = {
  leave: {
    title: "Leave this game?",
    message: "You will be removed from the player list.",
    confirmLabel: "Leave Game",
  },
  withdraw: {
    title: "Withdraw request?",
    message: "The host will no longer see your join request.",
    confirmLabel: "Withdraw Request",
  },
  delete: {
    title: "Delete this game?",
    message: "This cannot be undone. All join requests will be removed.",
    confirmLabel: "Delete Game",
  },
} as const;

type Props = {
  event: SportEvent;
  profile: Profile | null;
  isSignedIn: boolean;
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onRequireSignIn: () => void;
  onEdit: (event: SportEvent) => void;
  onMutated: () => void | Promise<void>;
};

const skillLevelLabels: Record<SportEvent["skillLevel"], string> = {
  any: "Any level",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function EventDetailSheet({
  event,
  profile,
  isSignedIn,
  presented,
  onPresentedChange,
  onRequireSignIn,
  onEdit,
  onMutated,
}: Props) {
  const [confirming, setConfirming] = useState<
    keyof typeof destructiveActions | null
  >(null);
  const [pendingRequests, setPendingRequests] = useState<PendingJoinRequest[]>(
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const sport = sports.find((candidate) => candidate.id === event.sport);
  const spots = spotsLeft(event);
  const archived = isArchived(event);

  const loadRequests = useCallback(async () => {
    if (!event.isCreatedByCurrentUser || archived) {
      setPendingRequests([]);
      return;
    }
    try {
      setPendingRequests(await fetchPendingJoinRequests(event.id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not load requests",
      );
    }
  }, [archived, event.id, event.isCreatedByCurrentUser]);

  useEffect(() => {
    if (!presented) return;
    setActionError(null);
    void loadRequests();
  }, [loadRequests, presented]);

  const runMutation = async (action: () => Promise<void>) => {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      await onMutated();
      await loadRequests();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!profile) {
      setActionError("Profile not loaded");
      return;
    }
    const prefs = await sportPreferencesMap();
    await runMutation(() =>
      requestToJoin(event.id, profile, event.sport, prefs),
    );
  };

  const handleConfirm = async () => {
    if (!confirming) return;
    const kind = confirming;
    setConfirming(null);

    if (kind === "leave") {
      await runMutation(() => leaveEvent(event.id));
      return;
    }
    if (kind === "withdraw") {
      await runMutation(() => withdrawJoinRequest(event.id));
      return;
    }
    if (kind === "delete") {
      await runMutation(async () => {
        await deleteSportEvent(event.id);
        onPresentedChange(false);
      });
    }
  };

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
    <ModalSheet
      height="80svh"
      title={event.title}
      variant="detail"
      scroll={false}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <ModalSheetScroll>
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

        <div className="flex gap-4 pl-[17px]">
          <MetadataItem
            icon={<CreditCard size={12} />}
            label="Cost"
            value={event.cost?.trim() || "Not mentioned"}
          />
          <MetadataItem
            icon={<User size={12} />}
            label="Host"
            value={
              event.isCreatedByCurrentUser ? "You" : event.hostName ?? "Host"
            }
          />
        </div>

        {event.hostContact && event.isJoined && !event.isCreatedByCurrentUser ? (
          <>
            <hr className="detail-divider my-6" />
            <div className="pl-[17px]">
              <p className="detail-label">Host contact</p>
              <p className="detail-caption mt-1.5" style={{ fontWeight: 700 }}>
                <Icon
                  className="mr-1.5 inline-block align-[-2px] text-[var(--muted-icon)]"
                  icon={
                    event.hostContact.method === "telegram"
                      ? "mdi:telegram"
                      : "mdi:whatsapp"
                  }
                  width={14}
                />
                {event.hostName ?? "Host"} on{" "}
                {event.hostContact.method === "telegram"
                  ? "Telegram"
                  : "WhatsApp"}
              </p>
              <p className="detail-body">{event.hostContact.value}</p>
            </div>
          </>
        ) : null}

        {event.description ? (
          <div className="mt-6 pl-[17px]">
            <p className="detail-label">Description</p>
            <p className="detail-body mt-1.5">{event.description}</p>
          </div>
        ) : null}

        {event.isCreatedByCurrentUser && !archived ? (
          <>
            <hr className="detail-divider my-6" />
            <div className="pl-[17px]">
              <p className="detail-label">Requests</p>
              {pendingRequests.length > 0 ? (
                <PendingRequestRows
                  approvingId={approvingId}
                  onApprove={async (requestId) => {
                    setApprovingId(requestId);
                    setActionError(null);
                    try {
                      await approveJoinRequest(requestId);
                      await onMutated();
                      await loadRequests();
                    } catch (error) {
                      setActionError(
                        error instanceof Error
                          ? error.message
                          : "Could not approve request",
                      );
                    } finally {
                      setApprovingId(null);
                    }
                  }}
                  requests={pendingRequests}
                />
              ) : (
                <p className="detail-body mt-2">No pending requests</p>
              )}
              <button
                className="outline-action mt-4"
                onClick={() => onEdit(event)}
                type="button"
              >
                Edit game details
              </button>
              <button
                className="text-danger-action mt-3"
                onClick={() => setConfirming("delete")}
                type="button"
              >
                Delete game
              </button>
            </div>
          </>
        ) : null}

        {event.isJoined && !event.isCreatedByCurrentUser && !archived ? (
          <button
            className="text-danger-action mt-4"
            disabled={busy}
            onClick={() => setConfirming("leave")}
            type="button"
          >
            Leave game
          </button>
        ) : null}

        {actionError ? (
          <p className="form-error mt-4 px-4">{actionError}</p>
        ) : null}
      </ModalSheetScroll>

      {archived || !event.isCreatedByCurrentUser ? (
        <div className="detail-bottom">
          {archived ? (
            <p className="empty-state pb-3 pt-0 text-center">Archived game</p>
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
              disabled={busy || (spots === 0 && !event.hasPendingRequest && isSignedIn)}
              onClick={() => {
                if (!isSignedIn) {
                  onRequireSignIn();
                  return;
                }
                if (event.hasPendingRequest) {
                  setConfirming("withdraw");
                  return;
                }
                void handleJoin();
              }}
              type="button"
            >
              {!isSignedIn
                ? "Sign in to join"
                : busy
                  ? "Working…"
                  : event.hasPendingRequest
                    ? "Withdraw request"
                    : spots === 0
                      ? "Game full"
                      : "Request to join"}
            </button>
          )}
        </div>
      ) : null}

      {confirming ? (
        <ConfirmDialog
          {...destructiveActions[confirming]}
          onConfirm={() => void handleConfirm()}
          onCancel={() => setConfirming(null)}
        />
      ) : null}
    </ModalSheet>
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

function PendingRequestRows({
  requests,
  approvingId,
  onApprove,
}: {
  requests: PendingJoinRequest[];
  approvingId: string | null;
  onApprove: (requestId: string) => void;
}) {
  return (
    <div>
      {requests.map((requester) => (
        <div
          className="flex items-center gap-3 border-b border-[var(--hairline)] py-3"
          key={requester.id}
        >
          <div className="min-w-0 flex-1">
            <p className="detail-body" style={{ fontWeight: 600 }}>
              {requester.requesterName}
            </p>
            <p className="detail-caption mt-1">
              {skillLevelLabels[requester.requesterLevel]} · Pending
            </p>
          </div>
          <button
            className="approve-pill"
            disabled={approvingId === requester.id}
            onClick={() => onApprove(requester.id)}
            type="button"
          >
            {approvingId === requester.id ? "…" : "Approve"}
          </button>
        </div>
      ))}
    </div>
  );
}
