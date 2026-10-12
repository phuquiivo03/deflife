"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: "right" | "bottom" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-white p-4 shadow-lg outline-none",
          side === "right" &&
            "inset-y-0 right-0 h-full w-[360px] max-w-[100vw] border-l",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[45vh] rounded-t-xl border-t",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-3 top-3 rounded-md p-1 hover:bg-zinc-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
