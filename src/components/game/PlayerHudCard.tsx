"use client";

import { STUB_PLAYER } from "@/game/state/playerStats";
import { useGameStore } from "@/game/state/store";
import { canSleepAt, phaseById, snapshot, type PhaseId } from "@/game/time";
import { resolveShippedIcon } from "@/lib/pixel-assets";
import { PixelIcon } from "./PixelIcon";
import { formatVnd } from "@/lib/format-currency";
import { PixelAvatar } from "./PixelAvatar";
import { PanelCard } from "@/components/ui/panel-card";
import { Button } from "@/components/ui/button";
import { StatBar } from "./StatBar";

export function PlayerHudCard({ iconFiles = [] }: { iconFiles?: readonly string[] }) {
  const p = STUB_PLAYER;
  const day = useGameStore((s) => snapshot(s.totalMinutes).day);
  const clockLabel = useGameStore((s) => snapshot(s.totalMinutes).clockLabel);
  const phaseId = useGameStore((s) => snapshot(s.totalMinutes).phaseId);
  const sleep = useGameStore((s) => s.sleep);
  const canSleep = useGameStore((s) => canSleepAt(s.totalMinutes));

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
            <span
              className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--muted-foreground)]"
              data-testid="game-clock"
              data-day={day}
              data-time={clockLabel}
              data-phase={phaseId}
            >
              <PixelIcon name="clock" size={22} alt="" />
              <span>Ngày {day}</span>
              <span className="text-[var(--foreground)]">{clockLabel}</span>
              <PhaseMark phaseId={phaseId} iconFiles={iconFiles} />
            </span>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              showArrow={false}
              disabled={!canSleep}
              aria-disabled={!canSleep}
              title={
                canSleep
                  ? "Ngủ đến 06:00 ngày mai"
                  : "Chỉ ngủ được vào Tối hoặc Khuya"
              }
              className={canSleep ? "sleep-glow" : undefined}
              onClick={sleep}
              data-testid="sleep-button"
            >
              Đi ngủ
            </Button>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function PhaseMark({
  phaseId,
  iconFiles,
}: {
  phaseId: PhaseId;
  iconFiles: readonly string[];
}) {
  const phase = phaseById(phaseId);
  const art = resolveShippedIcon(phase.iconKey, 22, iconFiles);
  return (
    <span className="inline-flex items-center gap-1 text-[var(--foreground)]">
      <span data-icon-key={phase.iconKey} className="inline-flex">
        {art ? (
          <PixelIcon name={phase.iconKey} size={22} alt="" files={iconFiles} />
        ) : (
          <span
            className="inline-flex h-[22px] w-[22px] items-center justify-center text-[16px] leading-4"
            role="img"
            aria-label={phase.label}
          >
            {phase.emoji}
          </span>
        )}
      </span>
      <span>{phase.label}</span>
    </span>
  );
}
