"use client";

import { SIM_CATALOG } from "@/game/career/content";
import { VITAL_MAX } from "@/game/state/playerStats";
import { calendar, holidayOn } from "@/game/life/logic";
import { useGameStore, type CareerPanel } from "@/game/state/store";
import { canSleepAt, phaseById, snapshot, type PhaseId } from "@/game/time";
import { resolveShippedIcon } from "@/lib/pixel-assets";
import { cn } from "@/lib/utils";
import { AudioControls } from "./AudioControls";
import { PixelIcon } from "./PixelIcon";
import { formatVnd } from "@/lib/format-currency";
import { PanelCard } from "@/components/ui/panel-card";
import { Button } from "@/components/ui/button";
import { StatBar } from "./StatBar";

/** Native icon for the Kỹ năng button. Swap this name when a new file ships. */
export const SKILL_MENU_ICON = "skills";

const CAREER_ACTIONS = [
  {
    id: "study",
    testId: "open-study",
    label: "Học",
    icon: "learn_book",
    tone: "hud-action-study",
  },
  {
    id: "jobs",
    testId: "open-jobs",
    label: "Việc làm",
    icon: "job_freelance",
    tone: "hud-action-jobs",
  },
  {
    id: "skills",
    testId: "open-skills",
    label: "Kỹ năng",
    icon: SKILL_MENU_ICON,
    tone: "hud-action-skills",
  },
] as const satisfies readonly {
  id: CareerPanel;
  testId: string;
  label: string;
  icon: string;
  tone: string;
}[];

export function PlayerHudCard({ iconFiles = [] }: { iconFiles?: readonly string[] }) {
  const health = useGameStore((s) => s.career.players.health);
  const mood = useGameStore((s) => s.career.players.mood);
  const energy = useGameStore((s) => s.career.players.energy);
  const money = useGameStore((s) => s.career.players.money);
  const day = useGameStore((s) => snapshot(s.totalMinutes).day);
  const clockLabel = useGameStore((s) => snapshot(s.totalMinutes).clockLabel);
  const phaseId = useGameStore((s) => snapshot(s.totalMinutes).phaseId);
  const fastForward = useGameStore((s) => s.fastForward);
  const sleep = useGameStore((s) => s.sleep);
  const canSleep = useGameStore((s) => canSleepAt(s.totalMinutes));
  const openCareerPanel = useGameStore((s) => s.openCareerPanel);

  const energyMax = SIM_CATALOG.config.energy_max;

  return (
    <PanelCard className="w-full max-w-[520px] p-3">
      <div className="grid grid-cols-3 gap-2">
        <HudVital
          icon="health"
          label="Sức khỏe"
          value={health}
          max={VITAL_MAX}
          tone="coral"
          testId="hud-health"
        />
        <HudVital
          icon="mood"
          label="Tinh thần"
          value={mood}
          max={VITAL_MAX}
          tone="mint"
          testId="hud-mood"
        />
        <HudVital
          icon="energy"
          label="Năng lượng"
          value={energy}
          max={energyMax}
          tone="sky"
          testId="hud-energy"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="hud-chip font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
          <PixelIcon name="savings" size={22} alt="" />
          <span data-testid="hud-money">{formatVnd(money)}</span>
        </span>
        <span
          className={
            fastForward
              ? "hud-chip fast-forward-flash font-galmuri-7 text-galmuri-small text-[var(--foreground)]"
              : "hud-chip font-galmuri-7 text-galmuri-small text-[var(--foreground)]"
          }
          data-testid="game-clock"
          data-day={day}
          data-weekday={calendar(day).weekdayLabel}
          data-holiday={holidayOn(day) ?? ""}
          data-time={clockLabel}
          data-phase={phaseId}
          data-fast-forward={fastForward ? "1" : "0"}
        >
          <PhaseMark phaseId={phaseId} iconFiles={iconFiles} />
          <span>Ngày {day}</span>
          <span>{calendar(day).weekdayLabel}</span>
          <span>{clockLabel}</span>
          <span>{phaseById(phaseId).label}</span>
        </span>
        <Button
          type="button"
          size="sm"
          showArrow={false}
          disabled={!canSleep}
          aria-disabled={!canSleep}
          title={canSleep ? "Ngủ đến 06:00 ngày mai" : "Chỉ ngủ được vào Tối hoặc Đêm"}
          className={canSleep ? "hud-sleep sleep-glow ml-auto" : "hud-sleep ml-auto"}
          onClick={sleep}
          data-testid="sleep-button"
        >
          Đi ngủ
        </Button>
      </div>
      <div className="hud-actions mt-3">
        <div className="hud-actions-grid">
          {CAREER_ACTIONS.map((action) => (
            <CareerHudButton
              key={action.id}
              action={action}
              iconFiles={iconFiles}
              onClick={() => openCareerPanel(action.id)}
            />
          ))}
        </div>
      </div>
      <AudioControls iconFiles={iconFiles} />
    </PanelCard>
  );
}

function HudVital({
  icon,
  label,
  value,
  max,
  tone,
  testId,
}: {
  icon: string;
  label: string;
  value: number;
  max: number;
  tone: "coral" | "mint" | "sky";
  testId: string;
}) {
  const shown = Math.round(value);
  return (
    <div className="hud-vital min-w-0" data-testid={testId} data-value={shown} data-max={max}>
      <div className="hud-vital-head mb-1">
        <PixelIcon name={icon} size={22} alt="" />
        <span className="flex min-w-0 flex-col font-galmuri-7 text-galmuri-small leading-tight">
          <span className="whitespace-nowrap text-[var(--muted-foreground)]">{label}</span>
          <span className="whitespace-nowrap text-[var(--foreground)]">
            {shown}/{max}
          </span>
        </span>
      </div>
      <StatBar value={value} max={max} tone={tone} />
    </div>
  );
}

function CareerHudButton({
  action,
  iconFiles,
  onClick,
}: {
  action: (typeof CAREER_ACTIONS)[number];
  iconFiles: readonly string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={action.testId}
      className={cn("hud-action", action.tone)}
      onClick={onClick}
    >
      <PixelIcon name={action.icon} size={22} alt="" files={iconFiles} />
      <span>{action.label}</span>
    </button>
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
    </span>
  );
}
