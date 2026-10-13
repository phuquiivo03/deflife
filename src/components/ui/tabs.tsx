"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-12 items-center justify-center gap-1 rounded-full border-2 border-foreground bg-muted p-1 text-muted-foreground md:h-10",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition-bouncy data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-pop md:min-h-8",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("animate-pop-in focus-visible:outline-none", className)}
      {...props}
    />
  );
}
