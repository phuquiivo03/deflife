"use client";

import { SIM_CATALOG } from "@/game/career/content";
import { skillProgressList, type SkillProgress } from "@/game/knowledge/logic";
import { STUB_PLAYER } from "@/game/state/playerStats";
import { useGameStore } from "@/game/state/store";
import { PanelCard } from "@/components/ui/panel-card";
import { RankBadge } from "./career/RankBadge";
import { PixelIcon } from "./PixelIcon";
import { PixelAvatar } from "./PixelAvatar";
import { StatBar } from "./StatBar";

export function PlayerInfoPanel({ iconFiles = [] }: { iconFiles?: readonly string[] }) {
  const p = STUB_PLAYER;
  const playerSkills = useGameStore((s) => s.career.player_skills);
  const skills = skillProgressList(playerSkills, SIM_CATALOG);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <PanelCard className="flex flex-col items-center p-4">
        <div className="mb-3 flex items-center justify-center overflow-hidden rounded-xl border-2 border-[#2d2858] bg-[#b8d9f0] shadow-[0_0_24px_rgba(90,99,196,0.35)]">
          <PixelAvatar role="player" size={96} alt={p.name} />
        </div>
        <p className="font-galmuri-11 text-galmuri-title-lg text-[var(--foreground)]">
          {p.name}
        </p>
        <p className="mt-1 font-galmuri-9 text-galmuri-body text-[var(--muted-foreground)]">
          {p.title}
        </p>
        <div className="mt-3 flex w-full items-center gap-2">
          <PixelIcon name="level" size={22} />
          <span className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
            Lv {p.level}
          </span>
          <StatBar value={p.exp} max={p.expMax} tone="exp" className="flex-1" />
        </div>
      </PanelCard>

      <PanelCard className="p-3">
        <ul className="flex flex-col gap-3" data-testid="player-skills">
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
      className="flex items-center gap-2"
    >
      <PixelIcon name={skill.icon} size={22} alt="" files={iconFiles} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
            {skill.name}
          </span>
          <span className="shrink-0 font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
            Cấp {skill.level}
          </span>
        </div>
        <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
          {skill.rankLabel} {skill.rankPercent}% · {skill.xpLine}
        </p>
        <StatBar value={skill.levelPercent} tone="mint" stepped className="mt-1" />
      </div>
      <RankBadge rankId={skill.rankId} size={24} />
    </li>
  );
}
