"use client";

import { Scroll, Sheet, VisuallyHidden } from "@silk-hq/components";
import clsx from "clsx";
import { createPortal } from "react-dom";
import "./ModalSheet.css";

type Props = {
  /** Sheet content height, e.g. "96svh" or "52svh". */
  height: string;
  /** Accessible sheet title (visually hidden; sheets render their own headers). */
  title: string;
  variant?: "form" | "detail";
  /** If false, children manage their own scrolling
      (e.g. detail sheet's pinned bottom bar). */
  scroll?: boolean;
  /**
   * When true the sheet can only be dismissed via an explicit
   * SheetDismissTrigger (e.g. the X button). Swipe-down and
   * backdrop-tap are both disabled. Use for Create / Edit forms
   * where accidental dismissal would lose unsaved work.
   */
  locked?: boolean;
  /** Controlled presentation. The sheet stays mounted; toggling this
      animates it in and out. Remounting Sheet.Root instead breaks
      Silk's dismissal/re-presentation lifecycle. */
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  children: React.ReactNode;
};

export function ModalSheet({
  height,
  title,
  variant = "form",
  scroll = true,
  locked = false,
  presented,
  onPresentedChange,
  children,
}: Props) {
  return (
    <Sheet.Root
      license="commercial"
      presented={presented}
      onPresentedChange={(next) => onPresentedChange(Boolean(next))}
    >
      <Sheet.Portal>
        <Sheet.View
          className="ModalSheet-view"
          swipeOvershoot={false}
          nativeEdgeSwipePrevention={true}
          onPresentAutoFocus={{ focus: false }}
          // locked: disable every passive dismissal path
          swipeDismissal={locked ? false : true}
          onClickOutside={locked ? { dismiss: false } : { dismiss: true }}
          onEscapeKeyDown={locked ? { dismiss: false } : { dismiss: true }}
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
            <VisuallyHidden.Root asChild>
              <Sheet.Title>{title}</Sheet.Title>
            </VisuallyHidden.Root>
            {/* Handle is hidden on locked sheets — dragging down is disabled */}
            {!locked && (
              <Sheet.Handle
                className="ModalSheet-handle"
                action="dismiss"
                aria-label="Close sheet"
              />
            )}
            {scroll ? (
              <ModalSheetScroll>{children}</ModalSheetScroll>
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
        className="ModalSheet-scrollView sheet-scroll-view"
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

// Mirrors iOS confirmationDialog for destructive actions. Rendered through a
// portal: inside a Silk sheet the content is transformed and overflow-hidden,
// which would break position:fixed and clip the dialog.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
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
    </div>,
    document.body,
  );
}
