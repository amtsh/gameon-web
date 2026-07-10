"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { sports } from "../data/mock-data";
import type { SkillLevel, SportKind } from "../types";

type CreateEventValues = {
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: string;
  description?: string;
};

type Props = {
  onClose: () => void;
};

const skillLevels: Array<{ id: SkillLevel; label: string }> = [
  { id: "any", label: "Any level" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function CreateEventSheet({ onClose }: Props) {
  const [sport, setSport] = useState<SportKind>("badminton");
  const {
    register,
    formState: { errors, isValid },
  } = useForm<CreateEventValues>({
    mode: "onChange",
    defaultValues: {
      title: "",
      venue: "",
      startsAt: "2026-07-12T18:00",
      endsAt: "2026-07-12T19:00",
      capacity: 8,
      cost: "",
      description: "",
    },
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="form-sheet" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-nav">
          <button aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2>Create Game</h2>
          <button disabled={!isValid}>Create</button>
        </header>

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
            <select style={{ width: "auto" }}>
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
          <div className="input-with-icon">
            <Search size={17} />
            <input
              placeholder="Venue"
              {...register("venue", { required: "Venue is required" })}
            />
          </div>
          {errors.venue ? <p className="form-error">{errors.venue.message}</p> : null}
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
              {...register("endsAt", { required: true })}
            />
          </label>
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
            <input type="checkbox" defaultChecked />
          </label>
        </div>

        <div className="form-section">
          <p className="form-label">Contact</p>
          <div className="contact-card">
            <Icon icon="mdi:telegram" width={20} />
            <span className="min-w-0 flex-1">
              <span className="detail-caption block" style={{ fontWeight: 700 }}>
                Shared after approval
              </span>
              <span className="detail-body">@amitplays</span>
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
      </section>
    </div>
  );
}
