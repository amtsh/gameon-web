"use client";

import clsx from "clsx";
import { useRef, useState } from "react";

type Props = {
  /** Sheet heights as viewport fractions, ascending. Mirrors iOS presentationDetents. */
  detents?: number[];
  variant?: "form" | "detail";
  /** If false, children manage their own scrolling (e.g. pinned bottom bar). */
  scroll?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalSheet({
  detents = [0.94],
  variant = "form",
  scroll = true,
  onClose,
  children,
}: Props) {
  const [detentIndex, setDetentIndex] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  const onPointerDown = (downEvent: React.PointerEvent) => {
    const sheet = downEvent.currentTarget.closest(".modal-sheet");
    if (!sheet) return;
    downEvent.currentTarget.setPointerCapture(downEvent.pointerId);
    dragStart.current = {
      y: downEvent.clientY,
      height: sheet.getBoundingClientRect().height,
    };
  };

  const onPointerMove = (moveEvent: React.PointerEvent) => {
    if (!dragStart.current) return;
    const next =
      dragStart.current.height + (dragStart.current.y - moveEvent.clientY);
    setDragHeight(Math.min(next, window.innerHeight * 0.94));
  };

  const onPointerEnd = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    if (dragHeight === null) return;

    const viewportHeight = window.innerHeight;
    // Dragged well below the smallest detent → dismiss.
    if (dragHeight < detents[0] * viewportHeight - 120) {
      setDragHeight(null);
      onClose();
      return;
    }
    const nearest = detents.reduce(
      (best, candidate, index) =>
        Math.abs(candidate * viewportHeight - dragHeight) <
        Math.abs(detents[best] * viewportHeight - dragHeight)
          ? index
          : best,
      0,
    );
    setDetentIndex(nearest);
    setDragHeight(null);
  };

  const style: React.CSSProperties = {
    height: dragHeight ?? `${detents[detentIndex] * 100}svh`,
    transition:
      dragHeight !== null
        ? "none"
        : "height 280ms cubic-bezier(0.32, 0.72, 0, 1)",
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={clsx("modal-sheet", variant)}
        style={style}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div
          className="sheet-drag-zone"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="sheet-grabber" />
        </div>
        <div className={clsx("modal-sheet-body", scroll && "scroll")}>
          {children}
        </div>
      </section>
    </div>
  );
}

type ConfirmProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Mirrors iOS confirmationDialog for destructive actions.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div
        className="confirm-card"
        role="alertdialog"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <p className="confirm-title">{title}</p>
        <p className="confirm-message">{message}</p>
        <button className="destructive" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
