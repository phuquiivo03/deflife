"use client";

import { SIM_CATALOG } from "@/game/career/content";
import {
  formatRankLabel,
  levelProgressPercent,
  rankBracketForLevel,
  rankProgressPercent,
  xpToNextLevel,
} from "@/game/knowledge/logic";
import { useGameStore } from "@/game/state/store";
import { PixelIcon } from "../PixelIcon";
import { StatBar } from "../StatBar";
import { RankBadge } from "./RankBadge";

const freelanceGoal = SIM_CATALOG.milestones.reduce(
  (max, row) => Math.max(max, row.freelance_completed),
  0,
);

export function SkillRankPanel({ iconFiles }: { iconFiles: readonly string[] }) {
  const skills = useGameStore((s) => s.career.player_skills);
  const reputation = useGameStore((s) => s.career.players.reputation);
  const freelance = useGameStore((s) => s.career.players.freelance_completed);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
        <span className="inline-flex items-center gap-2">
          <PixelIcon name="reputation_medal" size={22} alt="" files={iconFiles} />
          Uy tín {reputation}
        </span>
        <span data-testid="freelance-count">
          Freelance {freelance}/{freelanceGoal}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {SIM_CATALOG.skills.map((def) => {
          const row = skills.find((skill) => skill.skill_id === def.id) ?? {
            skill_id: def.id,
            level: 1,
            xp: 0,
          };
          const bracket = rankBracketForLevel(row.level, SIM_CATALOG.config.rank_brackets);
          const need = xpToNextLevel(row.level, SIM_CATALOG.skillLevelXp);
          const rankPercent = rankProgressPercent(row.level, row.xp, need, bracket);
          const levelPercent = levelProgressPercent(row.level, row.xp, SIM_CATALOG.skillLevelXp);
          return (
            <li
              key={def.id}
              data-testid={`skill-row-${def.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--panel-border)] bg-white/50 p-2"
            >
              <PixelIcon name={def.icon} size={44} alt="" files={iconFiles} />
              <div className="min-w-0 flex-1">
                <p className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
                  {formatRankLabel(def.name, bracket.label, rankPercent)}
                </p>
                <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
                  Cấp {row.level}
                  {need > 0 ? ` · ${row.xp}/${need} XP` : " · tối đa"}
                </p>
                <StatBar value={levelPercent} tone="mint" stepped className="mt-1" />
              </div>
              <RankBadge rankId={bracket.id} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
