"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createSportEvent,
  updateSportEvent,
} from "@/lib/data/create-event.client";
import type { Profile } from "@/lib/data/profile.shared";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";
import { VenueSearchField } from "./VenueSearchField";
import type { SkillLevel, SportEvent, SportKind, Venue } from "../types";

type CreateEventValues = {
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: string;
  description?: string;
};

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onContact: () => void;
  profile: Profile | null;
  editEvent?: SportEvent;
  onSaved: () => void | Promise<void>;
};

const skillLevels: Array<{ id: SkillLevel; label: string }> = [
  { id: "any", label: "Any level" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

function toLocalDateTimeInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateEventSheet({
  presented,
  onPresentedChange,
  onContact,
  profile,
  editEvent,
  onSaved,
}: Props) {
  const isEditing = Boolean(editEvent);
  const [sport, setSport] = useState<SportKind>("badminton");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fillYourSpot, setFillYourSpot] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateEventValues>({
    mode: "onChange",
    defaultValues: {
      title: "",
      startsAt: "2026-07-12T18:00",
      endsAt: "2026-07-12T19:00",
      capacity: 8,
      cost: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!presented) return;

    // Deferred one frame: React's lint forbids synchronous setState in
    // effects, and the reset is invisible behind the sheet-open animation.
    const frame = requestAnimationFrame(() => {
      if (editEvent) {
        setSport(editEvent.sport);
        setSkillLevel(editEvent.skillLevel);
        setVenue(editEvent.venue);
        setFillYourSpot(false);
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

      setSport("badminton");
      setSkillLevel("any");
      setVenue(null);
      setFillYourSpot(true);
      reset({
        title: "",
        startsAt: "2026-07-12T18:00",
        endsAt: "2026-07-12T19:00",
        capacity: 8,
        cost: "",
        description: "",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [editEvent, presented, reset]);

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
          profile,
        });
      }
      await onSaved();
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

  return (
    <ModalSheet
      height="96svh"
      title={sheetTitle}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <form className="create-event-form" onSubmit={onSubmit}>
        <header className="sheet-nav">
          <SheetDismissTrigger>
            <button aria-label="Close" type="button">
              <X size={20} />
            </button>
          </SheetDismissTrigger>
          <h2>{sheetTitle}</h2>
          <button
            disabled={!isValid || !venue || isSubmitting || !profile}
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
              {...register("startsAt", { required: true })}
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
            placeholder="Description (optional)"
            rows={4}
            {...register("description")}
          />
        </div>
      </form>
    </ModalSheet>
  );
}
