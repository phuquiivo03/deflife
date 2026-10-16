"use client";

import { SIM_CATALOG } from "@/game/career/content";
import { overallRankBracket, skillProgressList, type SkillProgress } from "@/game/knowledge/logic";
import { freelanceGoal } from "@/game/jobs/logic";
import { STUB_PLAYER } from "@/game/state/playerStats";
import { useGameStore } from "@/game/state/store";
import type { StageId } from "@/game/config";
import { STAGE_LABELS } from "@/lib/stage-labels";
import { PanelCard } from "@/components/ui/panel-card";
import { RankBadge } from "./career/RankBadge";
import { PixelIcon } from "./PixelIcon";
import { PixelAvatar } from "./PixelAvatar";
import { StatBar } from "./StatBar";

const goal = freelanceGoal(SIM_CATALOG.milestones);

export function PlayerInfoPanel({ iconFiles = [] }: { iconFiles?: readonly string[] }) {
  const p = STUB_PLAYER;
  const stage = useGameStore((s) => s.stage);
  const playerSkills = useGameStore((s) => s.career.player_skills);
  const reputation = useGameStore((s) => s.career.players.reputation);
  const freelance = useGameStore((s) => s.career.players.freelance_completed);
  const skills = skillProgressList(playerSkills, SIM_CATALOG);
  const overall = overallRankBracket(
    skills.map((skill) => skill.level),
    SIM_CATALOG.config.rank_brackets,
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <PanelCard className="flex flex-col items-center p-3">
        <div className="mb-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-[var(--room-frame)] bg-[#b8d9f0]">
          <PixelAvatar role="player" size={96} alt={p.name} />
        </div>
        <div className="flex items-center justify-center gap-1">
          <p className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">{p.name}</p>
          <RankBadge rankId={overall.id} size={24} />
        </div>
        <p
          className="mt-1 font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]"
          data-testid="player-rank"
          data-rank={overall.id}
        >
          {STAGE_LABELS[stage as StageId]} · {overall.label}
        </p>
        <div className="mt-3 flex w-full items-center gap-2 text-left">
          <PixelIcon name="reputation_medal" size={22} alt="" files={iconFiles} />
          <span className="flex-1 font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
            Danh tiếng
          </span>
          <span
            className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]"
            data-testid="player-reputation"
          >
            {reputation}
          </span>
        </div>
        <div className="mt-2 flex w-full items-center gap-2 text-left">
          <PixelIcon name="job_freelance" size={22} alt="" files={iconFiles} />
          <span className="flex-1 font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
            Freelance
          </span>
          <span
            className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]"
            data-testid="player-freelance"
            data-value={freelance}
            data-goal={goal}
          >
            {freelance}/{goal}
          </span>
        </div>
        <StatBar value={freelance} max={goal} tone="mint" className="mt-1" />
      </PanelCard>

      <PanelCard className="px-3 py-1 lg:flex-1">
        <ul data-testid="player-skills">
          {skills.map((skill) => (
            <PlayerSkillRow key={skill.id} skill={skill} iconFiles={iconFiles} />
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}

function PlayerSkillRow({
  skill,
  iconFiles,
}: {
  skill: SkillProgress;
  iconFiles: readonly string[];
}) {
  return (
    <li
      data-testid={`player-skill-${skill.id}`}
      data-level={skill.level}
      data-xp={skill.xp}
      data-need={skill.xpToNext}
      data-rank={skill.rankId}
      data-rank-percent={skill.rankPercent}
      className="flex items-center gap-2 border-b border-dashed border-[var(--panel-border)] py-2 last:border-b-0"
    >
      <PixelIcon name={skill.icon} size={22} alt="" files={iconFiles} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
            {skill.name}
          </span>
          <RankBadge rankId={skill.rankId} size={24} />
        </div>
        <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
          {skill.rankLabel} {skill.rankPercent}%
        </p>
        <StatBar value={skill.rankPercent} tone="mint" stepped className="mt-1" />
      </div>
    </li>
  );
}
