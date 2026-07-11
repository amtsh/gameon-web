"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSportEvent } from "@/lib/data/create-event.client";
import type { Profile } from "@/lib/data/profile.shared";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";
import { VenueSearchField } from "./VenueSearchField";
import type { SkillLevel, SportKind, Venue } from "../types";

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
  profile: Profile | null;
  onCreated: () => void | Promise<void>;
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
  profile,
  onCreated,
}: Props) {
  const [sport, setSport] = useState<SportKind>("badminton");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("any");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fillYourSpot, setFillYourSpot] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
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

  const onSubmit = handleSubmit(async (values) => {
    if (!venue) return;
    if (!profile) {
      setSubmitError("Profile not loaded. Close and try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
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
      await onCreated();
      onPresentedChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not create game",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const contactMethod = profile?.contact_method;
  const contactValue = profile?.contact_value;

  return (
    <ModalSheet
      height="96svh"
      title="Create Game"
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
          <h2>Create Game</h2>
          <button
            disabled={!isValid || !venue || isSubmitting || !profile}
            type="submit"
          >
            {isSubmitting ? "Creating…" : "Create"}
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
          <label className="toggle-row">
            <span>Fill your spot</span>
            <input
              checked={fillYourSpot}
              onChange={(changeEvent) => setFillYourSpot(changeEvent.target.checked)}
              type="checkbox"
            />
          </label>
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
            <span className="min-w-0 flex-1">
              <span className="detail-caption block" style={{ fontWeight: 700 }}>
                Shared after approval
              </span>
              <span className="detail-body">
                {contactValue ?? "Add contact in profile"}
              </span>
            </span>
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
