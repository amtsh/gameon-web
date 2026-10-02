"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteAccount } from "@/lib/data/profile-mutations.client";
import { ModalSheet, ModalSheetScroll, SheetDismissTrigger } from "./ModalSheet";
import "./PlayersSheet.css";
import "./DeleteAccountSheet.css";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
};

export function DeleteAccountSheet({ presented, onPresentedChange }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!presented) return;

    const frame = requestAnimationFrame(() => {
      setDeleteError(null);
      setDeleting(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [presented]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      window.location.href = "/";
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete account",
      );
      setDeleting(false);
    }
  };

  return (
    <ModalSheet
      height="56svh"
      title="Delete account"
      scroll={false}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <div className="players-nav">
        <button
          aria-label="Close"
          className="players-nav-back"
          type="button"
          onClick={() => onPresentedChange(false)}
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
        </button>
        <div className="players-nav-center">
          <h2 className="players-nav-title">Delete account</h2>
        </div>
        <span style={{ width: 40 }} />
      </div>

      <ModalSheetScroll>
        <div className="delete-account-sheet">
          <p className="detail-title">This cannot be undone</p>
          <p className="detail-body mt-3">
            Your account and everything tied to it will be permanently deleted,
            including:
          </p>
          <ul className="delete-account-list">
            <li>Your profile and sport preferences</li>
            <li>Games you host</li>
            <li>Join requests and stored contact handles</li>
          </ul>

          {deleteError ? <p className="form-error mt-4">{deleteError}</p> : null}

          <button
            className="primary-action danger mt-6"
            disabled={deleting}
            onClick={() => void handleDelete()}
            type="button"
          >
            {deleting ? "Deleting\u2026" : "Delete my account"}
          </button>
          <SheetDismissTrigger>
            <button className="outline-action mt-3" disabled={deleting} type="button">
              Cancel
            </button>
          </SheetDismissTrigger>
        </div>
      </ModalSheetScroll>
    </ModalSheet>
  );
}
