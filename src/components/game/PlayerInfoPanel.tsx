"use client";

import { UserRound } from "lucide-react";
import { useGameStore } from "@/game/state/store";

export function PlayerInfoPanel() {
  const stage = useGameStore((s) => s.stage);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 text-zinc-500" />
        <h2 className="text-lg font-semibold text-zinc-900">Player info</h2>
      </div>
      <div
        className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center"
      >
        <p className="text-sm font-medium capitalize text-zinc-700">
          {stage} developer
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-zinc-500">
          Money, health, assets, and career stats will live here in a later
          milestone.
        </p>
      </div>
    </div>
  );
}
