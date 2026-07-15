"use client";

import { Sheet, useClientMediaQuery } from "@silk-hq/components";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import "./Toast.css";

type SheetRootProps = ComponentPropsWithoutRef<typeof Sheet.Root>;
type ToastRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const ToastRoot = forwardRef<ElementRef<typeof Sheet.Root>, ToastRootProps>(
  ({ children, ...restProps }, ref) => (
    <Sheet.Root license="commercial" sheetRole="" {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  ),
);
ToastRoot.displayName = "Toast.Root";

const ToastView = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery("(min-width: 1000px)");
  const contentPlacement = largeViewport ? "right" : "top";

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
>(({ children, className, ...restProps }, ref) => (
  <Sheet.Content
    className={`Toast-content ${className ?? ""}`.trim()}
    asChild
    {...restProps}
    ref={ref}
  >
    <Sheet.SpecialWrapper.Root>
      <Sheet.SpecialWrapper.Content className="Toast-innerContent">
        {children}
      </Sheet.SpecialWrapper.Content>
    </Sheet.SpecialWrapper.Root>
  </Sheet.Content>
));
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
