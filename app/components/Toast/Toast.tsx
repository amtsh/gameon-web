"use client";

import { Sheet, useClientMediaQuery } from "@silk-hq/components";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import "./Toast.css";

type ToastContextValue = {
  presented: boolean;
  setPresented: (presented: boolean) => void;
  pointerOver: boolean;
  setPointerOver: (pointerOver: boolean) => void;
  travelStatus: string;
  setTravelStatus: (status: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type SheetRootProps = ComponentPropsWithoutRef<typeof Sheet.Root>;
type ToastRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
  /** Auto-dismiss after this many ms. Pass false to keep open until dismissed. */
  autoCloseMs?: number | false;
};

const ToastRoot = forwardRef<ElementRef<typeof Sheet.Root>, ToastRootProps>(
  (
    {
      children,
      autoCloseMs = 5000,
      presented: presentedProp,
      onPresentedChange,
      ...restProps
    },
    ref,
  ) => {
    const [uncontrolledPresented, setUncontrolledPresented] = useState(false);
    const [pointerOver, setPointerOver] = useState(false);
    const [travelStatus, setTravelStatus] = useState("idleOutside");
    const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    );

    const isControlled = presentedProp !== undefined;
    const presented = isControlled ? presentedProp : uncontrolledPresented;

    const setPresented = (next: boolean) => {
      if (!isControlled) setUncontrolledPresented(next);
      onPresentedChange?.(next);
    };

    useEffect(() => {
      const startAutoCloseTimeout = () => {
        if (autoCloseMs === false) return;
        autoCloseTimeout.current = setTimeout(
          () => setPresented(false),
          autoCloseMs,
        );
      };

      const clearAutoCloseTimeout = () => {
        clearTimeout(autoCloseTimeout.current);
      };

      if (presented) {
        if (travelStatus === "idleInside" && !pointerOver) {
          startAutoCloseTimeout();
        } else {
          clearAutoCloseTimeout();
        }
      }
      return clearAutoCloseTimeout;
    }, [autoCloseMs, pointerOver, presented, travelStatus]);

    return (
      <ToastContext.Provider
        value={{
          presented,
          setPresented,
          pointerOver,
          setPointerOver,
          travelStatus,
          setTravelStatus,
        }}
      >
        <Sheet.Root
          license="commercial"
          presented={presented}
          onPresentedChange={setPresented}
          sheetRole=""
          {...restProps}
          ref={ref}
        >
          {children}
        </Sheet.Root>
      </ToastContext.Provider>
    );
  },
);
ToastRoot.displayName = "Toast.Root";

const ToastView = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery("(min-width: 1000px)");
  const contentPlacement = largeViewport ? "right" : "top";

  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("Toast.View must be used within Toast.Root");
  }
  const { setTravelStatus } = context;

  return (
    <div
      className={`Toast-container ${className ?? ""}`.trim()}
      role="status"
      aria-live="polite"
      {...restProps}
      ref={ref}
    >
      <Sheet.View
        className={`Toast-view ${className ?? ""}`.trim()}
        contentPlacement={contentPlacement}
        inertOutside={false}
        onPresentAutoFocus={{ focus: false }}
        onDismissAutoFocus={{ focus: false }}
        onClickOutside={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onEscapeKeyDown={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onTravelStatusChange={setTravelStatus}
      >
        {children}
      </Sheet.View>
    </div>
  );
});
ToastView.displayName = "Toast.View";

const ToastContent = forwardRef<
  ElementRef<typeof Sheet.Content>,
  ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("Toast.Content must be used within Toast.Root");
  }

  return (
    <Sheet.Content
      className={`Toast-content ${className ?? ""}`.trim()}
      asChild
      {...restProps}
      ref={ref}
    >
      <Sheet.SpecialWrapper.Root>
        <Sheet.SpecialWrapper.Content
          className="Toast-innerContent"
          onPointerEnter={() => context.setPointerOver(true)}
          onPointerLeave={() => context.setPointerOver(false)}
        >
          {children}
        </Sheet.SpecialWrapper.Content>
      </Sheet.SpecialWrapper.Root>
    </Sheet.Content>
  );
});
ToastContent.displayName = "Toast.Content";

const ToastPortal = Sheet.Portal;
const ToastTrigger = Sheet.Trigger;
const ToastHandle = Sheet.Handle;
const ToastOutlet = Sheet.Outlet;
const ToastTitle = Sheet.Title;
const ToastDescription = Sheet.Description;

export const Toast = {
  Root: ToastRoot,
  Portal: ToastPortal,
  View: ToastView,
  Content: ToastContent,
  Trigger: ToastTrigger,
  Title: ToastTitle,
  Description: ToastDescription,
  Handle: ToastHandle,
  Outlet: ToastOutlet,
};
