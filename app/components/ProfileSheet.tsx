"use client";

import { Icon } from "@iconify/react";
import { X } from "lucide-react";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";

type Props = {
  onClose: () => void;
  onContact: () => void;
};

export function ProfileSheet({ onClose, onContact }: Props) {
  return (
    <ModalSheet height="96svh" onClose={onClose}>
        <header className="sheet-nav">
          <SheetDismissTrigger>
            <button aria-label="Close">
              <X size={20} />
            </button>
          </SheetDismissTrigger>
          <h2>Edit profile</h2>
          <button>Save</button>
        </header>

        <div className="profile-hero">
          <h1>Profile</h1>
          <p>Update your name, games, and current level.</p>
        </div>

        <div className="form-section">
          <label className="form-label">Postal code</label>
          <input defaultValue="112 20" placeholder="Postal code" />
          <p className="hint">Nearby games will use postal code 112 20.</p>
        </div>

        <div className="form-section">
          <label className="form-label">Name</label>
          <input defaultValue="Amit" placeholder="Your name" />
        </div>

        <div className="form-section">
          <label className="form-label">Contact</label>
          <div className="contact-card">
            <Icon icon="mdi:telegram" width={20} />
            <span className="flex-1">
              <span className="block text-[12px] font-bold uppercase text-zinc-500">
                Shared after approval
              </span>
              <span className="font-semibold">@amitplays</span>
            </span>
            <button className="link-button" onClick={onContact}>
              Edit
            </button>
          </div>
        </div>

        <div className="form-section">
          <p className="form-label">Games</p>
          <div className="grid grid-cols-2 gap-2">
            {sports.map((sport, index) => (
              <button
                className={index < 2 ? "sport-tile selected" : "sport-tile"}
                key={sport.id}
              >
                <Icon icon={sport.icon} width={20} />
                {sport.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <p className="form-label">Level</p>
          {sports.slice(0, 2).map((sport) => (
            <label className="stepper-row" key={sport.id}>
              <span className="flex items-center gap-2">
                <Icon icon={sport.icon} width={16} />
                {sport.label}
              </span>
              <select defaultValue="beginner" style={{ width: "auto" }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          ))}
        </div>
    </ModalSheet>
  );
}
