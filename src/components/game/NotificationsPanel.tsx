"use client";

import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationsPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-zinc-500" />
        <h2 className="text-lg font-semibold text-zinc-900">Notifications</h2>
      </div>
      <ScrollArea className="flex-1">
        <div
          className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center"
        >
          <p className="text-sm font-medium text-zinc-700">Nothing new yet</p>
          <p className="mt-1 max-w-[220px] text-xs text-zinc-500">
            Tasks, bills, and life events will show up here as the sim grows.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
