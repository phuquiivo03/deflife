"use client";

import { STUB_PLAYER } from "@/game/state/playerStats";
import { formatVnd } from "@/lib/format-currency";
import { PixelIcon } from "./PixelIcon";
import { PixelAvatar } from "./PixelAvatar";
import { PanelCard } from "@/components/ui/panel-card";
import { StatBar } from "./StatBar";

export function PlayerHudCard() {
  const p = STUB_PLAYER;

  return (
    <PanelCard className="w-full max-w-[520px] p-3">
      <div className="flex gap-3">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--panel-border)] bg-[#b8d9f0]"
        >
          <PixelAvatar role="player" size={64} alt={p.name} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <PixelIcon name="health" size={22} />
              <StatBar value={p.health} tone="coral" className="flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <PixelIcon name="mood" size={22} />
              <StatBar value={p.mood} tone="mint" className="flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <PixelIcon name="energy" size={22} />
              <StatBar value={p.energy} tone="sky" className="flex-1" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <PixelIcon name="savings" size={22} />
              {formatVnd(p.money)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <PixelIcon name="clock" size={22} />
              Ngày {p.day}
            </span>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
