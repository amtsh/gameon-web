"use client";

import { Scroll, Sheet } from "@silk-hq/components";
import clsx from "clsx";
import "./ModalSheet.css";

type Props = {
  /** Sheet content height, e.g. "96svh" or "52svh". */
  height: string;
  /** Optional intermediate detent below full height,
      e.g. "62svh" for the detail sheet (iOS .fraction(0.62)). */
  intermediateDetent?: string;
  variant?: "form" | "detail";
  /** If false, children manage their own scrolling
      (e.g. detail sheet's pinned bottom bar). */
  scroll?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalSheet({
  height,
  intermediateDetent,
  variant = "form",
  scroll = true,
  onClose,
  children,
}: Props) {
  return (
    <Sheet.Root
      license="commercial"
      defaultPresented={true}
      defaultActiveDetent={intermediateDetent ? 1 : undefined}
      onPresentedChange={(presented) => {
        if (!presented) onClose();
      }}
    >
      <Sheet.Portal>
        <Sheet.View
          className="ModalSheet-view"
          detents={intermediateDetent}
          swipeOvershoot={false}
          nativeEdgeSwipePrevention={true}
        >
          <Sheet.Backdrop
            className="ModalSheet-backdrop"
            travelAnimation={{ opacity: [0, 1] }}
          />
          <Sheet.Content
            className={clsx("ModalSheet-content", variant)}
            style={{ height }}
          >
            <Sheet.BleedingBackground
              className={clsx("ModalSheet-bleedingBackground", variant)}
            />
            <Sheet.Handle
              className="ModalSheet-handle"
              action={intermediateDetent ? "step" : "dismiss"}
              aria-label={intermediateDetent ? "Resize sheet" : "Close sheet"}
            />
            {scroll ? (
              <Scroll.Root className="ModalSheet-scrollRoot">
                <Scroll.View
                  className="ModalSheet-scrollView no-scrollbar"
                  scrollGestureTrap={{ yEnd: true }}
                  onScrollStart={{ dismissKeyboard: true }}
                >
                  <Scroll.Content className="ModalSheet-scrollContent">
                    {children}
                  </Scroll.Content>
                </Scroll.View>
              </Scroll.Root>
            ) : (
              <div className="ModalSheet-body">{children}</div>
            )}
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}

/** Silk-managed scroll area for sheets that lay out their own body
    (e.g. detail sheet content above a pinned bottom bar). */
export function ModalSheetScroll({ children }: { children: React.ReactNode }) {
  return (
    <Scroll.Root className="ModalSheet-scrollRoot">
      <Scroll.View
        className="ModalSheet-scrollView no-scrollbar"
        scrollGestureTrap={{ yEnd: true }}
        onScrollStart={{ dismissKeyboard: true }}
      >
        <Scroll.Content className="ModalSheet-scrollContent">
          {children}
        </Scroll.Content>
      </Scroll.View>
    </Scroll.Root>
  );
}

/** Wrap a sheet's close (X) button so dismissal animates. */
export function SheetDismissTrigger({ children }: { children: React.ReactNode }) {
  return (
    <Sheet.Trigger action="dismiss" asChild>
      {children}
    </Sheet.Trigger>
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
