"use client";

import { Icon } from "@iconify/react";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  Gauge,
  MapPin,
  Share2,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadSportEventIcs } from "@/lib/calendar/download-ics.client";
import { contactUrl } from "@/lib/contact-url";
import { deleteSportEvent } from "@/lib/data/create-event.client";
import {
  approveJoinRequest,
  fetchHostContact,
  fetchHostJoinRequests,
  leaveEvent,
  requestToJoin,
  withdrawJoinRequest,
  type HostJoinRequest,
} from "@/lib/data/join-requests.client";
import type { ContactInfo } from "../types";
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
import { JoinGuideSheet } from "./JoinGuideSheet";
import { ConfirmDialog, ModalSheet, ModalSheetScroll } from "./ModalSheet";
import { getJoinGuideStep } from "@/lib/join/requirements";
import type { SportEvent } from "../types";

type Props = {
  event: SportEvent;
  profile: Profile | null;
  user: User | null;
  isSignedIn: boolean;
  authBusy: boolean;
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onEdit: (event: SportEvent) => void;
  onMutated: () => void | Promise<void>;
};

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
  leaveWaitlist: {
    title: "Leave waitlist?",
    message: "You will lose your spot in line if a place opens up.",
    confirmLabel: "Leave Waitlist",
  },
  delete: {
    title: "Delete this game?",
    message: "This cannot be undone. All join requests will be removed.",
    confirmLabel: "Delete Game",
  },
} as const;

const skillLevelLabels: Record<SportEvent["skillLevel"], string> = {
  any: "Any level",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function extractErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong";
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    const msg = [e.message, e.details, e.hint]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" \u2014 ");
    if (msg) return msg;
    if (e.code) return `Error ${String(e.code)}`;
  }
  return "Something went wrong";
}

export function EventDetailSheet({
  event,
  profile,
  user,
  isSignedIn,
  authBusy,
  presented,
  onPresentedChange,
  onEdit,
  onMutated,
}: Props) {
  const [confirming, setConfirming] = useState<
    keyof typeof destructiveActions | null
  >(null);
  const [joinGuideOpen, setJoinGuideOpen] = useState(false);
  const [hostRequests, setHostRequests] = useState<HostJoinRequest[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [hostContact, setHostContact] = useState<{
    eventId: string;
    contact: ContactInfo;
  } | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const sport = sports.find((candidate) => candidate.id === event.sport);
  const spots = spotsLeft(event);
  const archived = isArchived(event);
  const canAddToCalendar =
    !archived && (event.isJoined || event.isCreatedByCurrentUser);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/game/${event.id}`;
    return new URL(`/game/${event.id}`, window.location.origin).toString();
  }, [event.id]);

  const loadRequests = useCallback(async () => {
    setActionError(null);
    if (!event.isCreatedByCurrentUser || archived) {
      setHostRequests([]);
      return;
    }
    try {
      setHostRequests(await fetchHostJoinRequests(event.id));
    } catch (error) {
      setActionError(extractErrorMessage(error));
    }
  }, [archived, event.id, event.isCreatedByCurrentUser]);

  useEffect(() => {
    if (!presented || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("join") !== "1") return;

    params.delete("join");
    const remainder = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (remainder ? `?${remainder}` : ""),
    );
    // Deferred: the lint forbids synchronous setState in effects.
    const frame = requestAnimationFrame(() => setJoinGuideOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [presented]);

  useEffect(() => {
    if (!presented) return;
    const frame = requestAnimationFrame(() => void loadRequests());
    return () => cancelAnimationFrame(frame);
  }, [loadRequests, presented]);

  const contactEligible =
    presented && isSignedIn && Boolean(event.isJoined) &&
    !event.isCreatedByCurrentUser;
  const hostContactHref =
    hostContact?.eventId === event.id
      ? contactUrl(hostContact.contact)
      : null;

  useEffect(() => {
    if (!contactEligible) return;
    let cancelled = false;
    fetchHostContact(event.id)
      .then((contact) => {
        if (!cancelled && contact) {
          setHostContact({ eventId: event.id, contact });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [contactEligible, event.id]);

  const runMutation = async (action: () => Promise<void>) => {
    setActionError(null);
    setBusy(true);
    try {
      await action();
      await onMutated();
      await loadRequests();
    } catch (error) {
      setActionError(extractErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () => {
    if (!profile) {
      setActionError("Profile not loaded");
      return;
    }
    // Full games are routed to the waitlist by the database.
    void runMutation(async () => {
      const prefs = await sportPreferencesMap();
      await requestToJoin(event.id, profile, event.sport, prefs);
    });
  };

  const startJoinFlow = () => {
    if (getJoinGuideStep(isSignedIn, profile) !== null) {
      setJoinGuideOpen(true);
      return;
    }
    handleJoin();
  };

  const pendingRequests = hostRequests.filter((r) => r.status === "pending");
  const waitlistedRequests = hostRequests.filter(
    (r) => r.status === "waitlisted",
  );

  const handleApproveRequest = async (requestId: string) => {
    setApprovingId(requestId);
    setActionError(null);
    try {
      await approveJoinRequest(requestId);
      await onMutated();
      await loadRequests();
    } catch (error) {
      setActionError(extractErrorMessage(error));
    } finally {
      setApprovingId(null);
    }
  };

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `Join ${event.title} on GameOn`,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Link copied");
      window.setTimeout(() => setShareFeedback(null), 2000);
    } catch {
      setShareFeedback("Could not share");
      window.setTimeout(() => setShareFeedback(null), 2000);
    }
  }, [event.title, shareUrl]);

  const handleAddToCalendar = useCallback(() => {
    downloadSportEventIcs(event, shareUrl);
  }, [event, shareUrl]);

  const handleConfirm = async () => {
    if (!confirming) return;
    const kind = confirming;
    setConfirming(null);
    if (kind === "leave") { await runMutation(() => leaveEvent(event.id)); return; }
    // Withdrawing covers both pending requests and waitlist spots — same row.
    if (kind === "withdraw" || kind === "leaveWaitlist") {
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

  const dateTimeText = `${detailDate(new Date(event.startsAt))} \u00b7 ${clockTime(
    new Date(event.startsAt),
  )} - ${clockTime(new Date(event.endsAt))}`;

  const venueSubtitle = [
    [event.venue.address, event.venue.city].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" \u00b7 ");

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
            <div className="mt-1 flex items-start gap-3">
              <h2 className="detail-title flex-1">{event.title}</h2>
              <button
                aria-label="Share game"
                className="circle-button flex-shrink-0"
                onClick={() => void handleShare()}
                type="button"
              >
                <Share2 size={18} />
              </button>
            </div>
            <div className="row-badges mt-2">
              {event.isCreatedByCurrentUser ? <HostedByYouBadge /> : null}
              {event.isJoined && !event.isCreatedByCurrentUser ? (
                <span className="status-badge success">You are going</span>
              ) : null}
              {event.hasPendingRequest ? (
                <span className="status-badge warning">Pending request</span>
              ) : null}
              {event.isOnWaitlist ? (
                <span className="status-badge warning">On waitlist</span>
              ) : null}
            </div>
            {shareFeedback ? (
              <p className="detail-caption mt-2">{shareFeedback}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3.5">
          <span className="detail-icon-tile"><Calendar size={22} /></span>
          <div className="min-w-0 flex-1">
            <p className="detail-label">When</p>
            <p className="detail-body mt-1.5">{dateTimeText}</p>
            {canAddToCalendar ? (
              <>
                <button
                  className="link-info mt-1.5"
                  onClick={handleAddToCalendar}
                  type="button"
                >
                  Add to calendar
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
                <p className="detail-caption mt-1">
                  Reminders 24h and 1h before
                </p>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3.5">
          <span className="detail-icon-tile"><MapPin size={22} /></span>
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
            icon={<UserIcon size={12} />}
            label="Host"
            value={
              event.isCreatedByCurrentUser ? (
                "You"
              ) : (
                <>
                  <span className="block">{event.hostName ?? "Host"}</span>
                  {hostContactHref && hostContact?.eventId === event.id ? (
                    <a
                      className="host-meta-contact link-info mt-1.5 inline-flex"
                      href={hostContactHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Icon
                        icon={
                          hostContact.contact.method === "telegram"
                            ? "mdi:telegram"
                            : "mdi:whatsapp"
                        }
                        width={12}
                      />
                      {hostContact.contact.value}
                    </a>
                  ) : null}
                </>
              )
            }
          />
        </div>

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
                <JoinRequestRows
                  approvingId={approvingId}
                  canApprove={spots > 0}
                  onApprove={(requestId) => void handleApproveRequest(requestId)}
                  requests={pendingRequests}
                />
              ) : (
                <p className="detail-body mt-2">No pending requests</p>
              )}

              <p className="detail-label mt-5">Waitlist</p>
              {waitlistedRequests.length > 0 ? (
                <JoinRequestRows
                  approvingId={approvingId}
                  canApprove={spots > 0}
                  onApprove={(requestId) => void handleApproveRequest(requestId)}
                  requests={waitlistedRequests}
                  waitlist
                />
              ) : (
                <p className="detail-body mt-2">No one on the waitlist</p>
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
                event.hasPendingRequest || event.isOnWaitlist
                  ? "primary-action danger"
                  : "primary-action"
              }
              disabled={busy}
              onClick={() => {
                if (event.hasPendingRequest) { setConfirming("withdraw"); return; }
                if (event.isOnWaitlist) { setConfirming("leaveWaitlist"); return; }
                startJoinFlow();
              }}
              type="button"
            >
              {busy
                ? "Working\u2026"
                : event.hasPendingRequest
                  ? "Withdraw request"
                  : event.isOnWaitlist
                    ? "Leave waitlist"
                    : !isSignedIn
                      ? "Sign in to join"
                      : getJoinGuideStep(isSignedIn, profile) === "contact"
                      ? "Add contact to join"
                      : spots === 0
                        ? "Join waitlist"
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

      <JoinGuideSheet
        authBusy={authBusy}
        event={event}
        isWaitlist={spots === 0}
        onJoined={onMutated}
        onPresentedChange={setJoinGuideOpen}
        onProfileRefresh={onMutated}
        presented={joinGuideOpen}
        profile={profile}
        user={user}
      />
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
  value: React.ReactNode;
}) {
  return (
    <div className="metadata-item">
      <p className="meta-label">{icon}{label}</p>
      <p className="meta-value">{value}</p>
    </div>
  );
}

function JoinRequestRows({
  requests,
  approvingId,
  canApprove,
  onApprove,
  waitlist = false,
}: {
  requests: HostJoinRequest[];
  approvingId: string | null;
  canApprove: boolean;
  onApprove: (requestId: string) => void;
  waitlist?: boolean;
}) {
  return (
    <div>
      {requests.map((requester, index) => (
        <div
          className="flex items-center gap-3 border-b border-[var(--hairline)] py-3"
          key={requester.id}
        >
          <div className="min-w-0 flex-1">
            <p className="detail-body" style={{ fontWeight: 600 }}>
              {requester.requesterName}
            </p>
            <p className="detail-caption mt-1">
              {skillLevelLabels[requester.requesterLevel]}
              {" \u00b7 "}
              {waitlist
                ? `#${index + 1} in line`
                : "Pending"}
            </p>
          </div>
          {canApprove ? (
            <button
              className="approve-pill"
              disabled={approvingId === requester.id}
              onClick={() => onApprove(requester.id)}
              type="button"
            >
              {approvingId === requester.id ? "\u2026" : "Approve"}
            </button>
          ) : waitlist ? (
            <span className="status-badge warning">Waiting</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
