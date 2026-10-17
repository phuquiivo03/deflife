"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { TOOLTIP } from "./tooltip.config";

type TouchHandlers = {
  onPointerDown: (event: React.PointerEvent) => void;
  onClick: (event: React.MouseEvent) => void;
};

const TouchContext = React.createContext<TouchHandlers | null>(null);

function isOpenState(state: string | null) {
  return state === "instant-open" || state === "delayed-open";
}

export function TooltipProvider({
  delayDuration = TOOLTIP.openDelayMs,
  skipDelayDuration = TOOLTIP.skipDelayMs,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  delayDuration = TOOLTIP.openDelayMs,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TooltipPrimitive.Root>, "open" | "defaultOpen" | "onOpenChange">) {
  const [open, setOpen] = React.useState(false);
  const pointerType = React.useRef("");
  const wasOpenOnTouch = React.useRef(false);

  const touch = React.useMemo<TouchHandlers>(
    () => ({
      onPointerDown(event) {
        pointerType.current = event.pointerType;
        if (event.pointerType !== "touch") return;
        wasOpenOnTouch.current = isOpenState(event.currentTarget.getAttribute("data-state"));
      },
      onClick(event) {
        if (pointerType.current === "touch") {
          event.preventDefault();
          setOpen(wasOpenOnTouch.current ? false : true);
          return;
        }
        // Keyboard activation (detail 0) should keep the focus-opened tip up.
        if (event.detail === 0) event.preventDefault();
      },
    }),
    [],
  );

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TouchContext.Provider value={touch}>
        <TooltipPrimitive.Root
          {...props}
          open={open}
          onOpenChange={setOpen}
          delayDuration={delayDuration}
        >
          {children}
        </TooltipPrimitive.Root>
      </TouchContext.Provider>
    </TooltipProvider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof TooltipPrimitive.Trigger>
>(function TooltipTrigger(props, ref) {
  const touch = React.useContext(TouchContext);
  return (
    <TooltipPrimitive.Trigger
      type="button"
      ref={ref}
      {...props}
      onPointerDown={(event) => {
        touch?.onPointerDown(event);
        props.onPointerDown?.(event);
      }}
      onClick={(event) => {
        touch?.onClick(event);
        if (!event.defaultPrevented) props.onClick?.(event);
      }}
    />
  );
});

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof TooltipPrimitive.Content>
>(function TooltipContent(
  { className, sideOffset = TOOLTIP.sideOffsetPx, collisionPadding = TOOLTIP.collisionPaddingPx, style, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "ui-tooltip z-40 max-w-64 border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1 text-left font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)] shadow-panel outline-none",
          className,
        )}
        style={{
          animationDuration: `${TOOLTIP.enterMs}ms`,
          borderRadius: "var(--radius-panel)",
          ...style,
        }}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
