"use client";

import Image from "next/image";
import { STUB_PLAYER } from "@/game/state/playerStats";
import { formatVnd } from "@/lib/format-currency";
import { PixelIcon } from "./PixelIcon";
import { PanelCard } from "@/components/ui/panel-card";
import { StatBar } from "./StatBar";

export function PlayerHudCard() {
  const p = STUB_PLAYER;

  return (
    <PanelCard className="w-full max-w-[520px] p-3">
      <div className="flex gap-3">
        <div
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--panel-border)] bg-[#b8d9f0]"
        >
          <Image
            src="/ui/avatars/player-quy.png"
            alt={p.name}
            width={64}
            height={64}
            className="pixelated h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <PixelIcon name="heart" size={18} />
              <StatBar value={p.health} tone="coral" className="flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <PixelIcon name="smiley" size={18} />
              <StatBar value={p.mood} tone="mint" className="flex-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <PixelIcon name="lightning" size={18} />
              <StatBar value={p.energy} tone="sky" className="flex-1" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <PixelIcon name="coins" size={18} />
              {formatVnd(p.money)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <PixelIcon name="alarm-clock" size={18} />
              Ngày {p.day}
            </span>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
