"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createSportEvent,
  updateSportEvent,
} from "@/lib/data/create-event.client";
import type { Profile } from "@/lib/data/profile.shared";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";
import { VenueSearchField } from "./VenueSearchField";
import {
  buildCreatePrefill,
  toLocalDateTimeInput,
} from "@/lib/create-event/prefill";
import type { SkillLevel, SportEvent, SportKind, Venue } from "../types";

type CreateEventValues = {
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: string;
  description?: string;
};

function defaultSessionTimes() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  const end = new Date(start.getTime() + 60 * 60_000);
  return {
    startsAt: toLocalDateTimeInput(start.toISOString()),
    endsAt: toLocalDateTimeInput(end.toISOString()),
  };
}

function endTimeOneHourAfterStart(startsAt: string) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60_000);
  return toLocalDateTimeInput(end.toISOString());
}

function isCreateFormReady({
  title,
  startsAt,
  endsAt,
  capacity,
  venue,
  profile,
  isSubmitting,
}: {
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  venue: Venue | null;
  profile: Profile | null;
  isSubmitting: boolean;
}) {
  if (!profile || !venue || isSubmitting || !title.trim()) return false;

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (end <= start) return false;
  if (!Number.isFinite(capacity) || capacity < 2 || capacity > 30) return false;

  return true;
}

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onContact: () => void;
  profile: Profile | null;
  editEvent?: SportEvent;
  prefillFromEvent?: SportEvent;
  /** `created` is true for a brand-new game, false for an edit. */
  onSaved: (created: boolean) => void | Promise<void>;
};

const skillLevels: Array<{ id: SkillLevel; label: string }> = [
  { id: "any", label: "Any level" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function CreateEventSheet({
  presented,
  onPresentedChange,
  onContact,
  profile,
  editEvent,
  prefillFromEvent,
  onSaved,
}: Props) {
  const isEditing = Boolean(editEvent);
  const [sport, setSport] = useState<SportKind>("badminton");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fillYourSpot, setFillYourSpot] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preserveDraftRef = useRef(false);
  const wasPresentedRef = useRef(false);
  const skipPreserveOnCloseRef = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEventValues>({
    mode: "onChange",
    defaultValues: {
      title: "",
      ...defaultSessionTimes(),
      capacity: 8,
      cost: "",
      description: "",
    },
  });

  const title = watch("title");
  const startsAt = watch("startsAt");
  const endsAt = watch("endsAt");
  const capacity = watch("capacity");
  const canSubmit = isCreateFormReady({
    title,
    startsAt,
    endsAt,
    capacity,
    venue,
    profile,
    isSubmitting,
  });

  useEffect(() => {
    if (wasPresentedRef.current && !presented) {
      if (!skipPreserveOnCloseRef.current) {
        preserveDraftRef.current = true;
      }
      skipPreserveOnCloseRef.current = false;
    }
    wasPresentedRef.current = presented;
  }, [presented]);

  useEffect(() => {
    if (!presented) return;

    const frame = requestAnimationFrame(() => {
      if (editEvent) {
        preserveDraftRef.current = false;
        setSport(editEvent.sport);
        setSkillLevel(editEvent.skillLevel);
        setVenue(editEvent.venue);
        setFillYourSpot(false);
        setAutoApprove(editEvent.autoApprove ?? false);
        setIsPrivate(editEvent.isPrivate ?? false);
        reset({
          title: editEvent.title,
          startsAt: toLocalDateTimeInput(editEvent.startsAt),
          endsAt: toLocalDateTimeInput(editEvent.endsAt),
          capacity: editEvent.capacity,
          cost: editEvent.cost ?? "",
          description: editEvent.description ?? "",
        });
        return;
      }

      if (preserveDraftRef.current) return;

      if (prefillFromEvent) {
        const prefill = buildCreatePrefill(prefillFromEvent);
        setSport(prefill.sport);
        setSkillLevel(prefill.skillLevel);
        setVenue(prefill.venue);
        setFillYourSpot(true);
        setAutoApprove(prefill.autoApprove);
        setIsPrivate(prefill.isPrivate);
        reset({
          title: prefill.title,
          startsAt: prefill.startsAt,
          endsAt: prefill.endsAt,
          capacity: prefill.capacity,
          cost: prefill.cost,
          description: prefill.description,
        });
        return;
      }

      setSport("badminton");
      setSkillLevel("any");
      setVenue(null);
      setFillYourSpot(true);
      setAutoApprove(false);
      setIsPrivate(false);
      reset({
        title: "",
        ...defaultSessionTimes(),
        capacity: 8,
        cost: "",
        description: "",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [editEvent, prefillFromEvent, presented, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!venue) return;
    if (!profile) {
      setSubmitError("Profile not loaded. Close and try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editEvent) {
        await updateSportEvent({
          eventId: editEvent.id,
          sport,
          skillLevel,
          title: values.title,
          startsAt: values.startsAt,
          endsAt: values.endsAt,
          capacity: values.capacity,
          cost: values.cost,
          description: values.description,
          venue,
          autoApprove,
          isPrivate,
          profile,
        });
      } else {
        await createSportEvent({
          sport,
          skillLevel,
          title: values.title,
          startsAt: values.startsAt,
          endsAt: values.endsAt,
          capacity: values.capacity,
          cost: values.cost,
          description: values.description,
          venue,
          fillYourSpot,
          autoApprove,
          isPrivate,
          profile,
        });
      }
      await onSaved(!editEvent);
      preserveDraftRef.current = false;
      skipPreserveOnCloseRef.current = true;
      onPresentedChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Could not update game"
            : "Could not create game",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const contactMethod = profile?.contact_method;
  const contactValue = profile?.contact_value;
  const sheetTitle = isEditing ? "Edit Game" : "Create Game";
  const startsAtField = register("startsAt", { required: true });

  return (
    <ModalSheet
      height="96svh"
      title={sheetTitle}
      locked
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <form className="create-event-form" onSubmit={onSubmit}>
        <header className="sheet-nav">
          {/* Circle close button — only way to dismiss this locked sheet */}
          <SheetDismissTrigger>
            <button
              aria-label="Close"
              className="sheet-close-btn"
              type="button"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </SheetDismissTrigger>
          <h2>{sheetTitle}</h2>
          <button
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting
              ? isEditing
                ? "Saving\u2026"
                : "Creating\u2026"
              : isEditing
                ? "Save"
                : "Create"}
          </button>
        </header>

        {submitError ? <p className="form-error px-4">{submitError}</p> : null}

        <div className="form-section">
          <p className="form-label">Sport</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {sports.map((candidate) => (
              <button
                className={clsx("chip", candidate.id === sport && "chip-selected")}
                key={candidate.id}
                onClick={() => setSport(candidate.id)}
                type="button"
              >
                <Icon icon={candidate.icon} width={13} />
                {candidate.label}
              </button>
            ))}
          </div>
          <label className="stepper-row">
            <span>Level</span>
            <select
              onChange={(changeEvent) =>
                setSkillLevel(changeEvent.target.value as SkillLevel)
              }
              style={{ width: "auto" }}
              value={skillLevel}
            >
              {skillLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-section">
          <p className="form-label">Game</p>
          <VenueSearchField value={venue} onSelect={setVenue} />
          <input
            placeholder="Title"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title ? <p className="form-error">{errors.title.message}</p> : null}
          <label className="stepper-row">
            <span>Starts</span>
            <input
              style={{ width: "auto" }}
              type="datetime-local"
              {...startsAtField}
              onBlur={(blurEvent) => {
                startsAtField.onBlur(blurEvent);
                const nextEnd = endTimeOneHourAfterStart(blurEvent.target.value);
                if (nextEnd) {
                  setValue("endsAt", nextEnd, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
          </label>
          <label className="stepper-row">
            <span>Ends</span>
            <input
              style={{ width: "auto" }}
              type="datetime-local"
              {...register("endsAt", {
                required: true,
                validate: (endsAt, formValues) =>
                  new Date(endsAt) > new Date(formValues.startsAt) ||
                  "End must be after start",
              })}
            />
          </label>
          {errors.endsAt ? (
            <p className="form-error">{errors.endsAt.message}</p>
          ) : null}
          <input placeholder="Cost (80 SEK)" {...register("cost")} />
          <label className="stepper-row">
            <span>Capacity</span>
            <input
              type="number"
              min={2}
              max={30}
              {...register("capacity", { min: 2, max: 30, valueAsNumber: true })}
            />
          </label>
          {!isEditing ? (
            <label className="toggle-row">
              <span>Fill your spot</span>
              <input
                checked={fillYourSpot}
                onChange={(changeEvent) =>
                  setFillYourSpot(changeEvent.target.checked)
                }
                type="checkbox"
              />
            </label>
          ) : null}
          <label className="toggle-row">
            <span>Auto approve requests</span>
            <input
              checked={autoApprove}
              onChange={(changeEvent) =>
                setAutoApprove(changeEvent.target.checked)
              }
              type="checkbox"
            />
          </label>
          <label className="toggle-row">
            <span>Private game</span>
            <input
              checked={isPrivate}
              onChange={(changeEvent) =>
                setIsPrivate(changeEvent.target.checked)
              }
              type="checkbox"
            />
          </label>
          {isPrivate ? (
            <p className="detail-caption px-0">
              Only people with the shared link can join.
            </p>
          ) : null}
        </div>

        <div className="form-section">
          <p className="form-label">Contact</p>
          <div className="contact-card">
            <Icon
              icon={
                contactMethod === "whatsapp" ? "mdi:whatsapp" : "mdi:telegram"
              }
              width={20}
            />
            <span className="flex-1">
              <span className="detail-caption block" style={{ fontWeight: 700 }}>
                Shared after approval
              </span>
              <span className="detail-body">
                {contactValue ?? "Not set"}
              </span>
            </span>
            <button className="link-button" onClick={onContact} type="button">
              Edit
            </button>
          </div>
        </div>

        <div className="form-section">
          <p className="form-label">Description</p>
          <textarea
            placeholder={
              "A good description is\n" +
              "- Greet and tell players what to expect\n" +
              "- How payment works. (Prefer payment on venue)"
            }
            rows={4}
            {...register("description")}
          />
        </div>
      </form>
    </ModalSheet>
  );
}
