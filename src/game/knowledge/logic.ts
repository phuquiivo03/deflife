import type { GameEvent } from "../events/types";
import type {
  GameConfig,
  PlayerSkill,
  RankBracket,
  SimCatalog,
  SkillId,
  SkillLevelXp,
  StudyActivity,
  XpSource,
} from "../career/types";

/** Multiplier for the level the activity starts at. It does not change mid-grant. */
export function xpMultiplier(
  level: number,
  source: XpSource,
  config: GameConfig,
): number {
  const atCap = level >= config.study_cap_level;
  if (source === "study") {
    return atCap
      ? config.study_xp_multiplier_at_cap
      : config.study_xp_multiplier_below;
  }
  return atCap ? config.job_xp_multiplier_at_cap : config.job_xp_multiplier_below;
}

/** `floor(base * multiplier)`. A fraction below 1 grants 0. */
export function grantedXp(
  baseXp: number,
  level: number,
  source: XpSource,
  config: GameConfig,
): number {
  if (!(baseXp > 0)) return 0;
  return Math.floor(baseXp * xpMultiplier(level, source, config));
}

export function xpToNextLevel(level: number, curve: readonly SkillLevelXp[]): number {
  const row = curve.find((entry) => entry.level === level);
  return row?.xp_to_next ?? 0;
}

export function maxSkillLevel(curve: readonly SkillLevelXp[]): number {
  let max = 1;
  for (const row of curve) {
    if (row.level > max) max = row.level;
  }
  return max;
}

export type XpApplyResult = {
  skill: PlayerSkill;
  gained: number;
  levelUps: number[];
};

/**
 * Add already-multiplied XP. Level 10 (xp_to_next 0) discards the remainder.
 * One activity uses a single granted amount, then levels consume it in order.
 */
export function addSkillXp(
  skill: PlayerSkill,
  amount: number,
  curve: readonly SkillLevelXp[],
): XpApplyResult {
  const cap = maxSkillLevel(curve);
  const gained = amount > 0 ? Math.floor(amount) : 0;
  if (skill.level >= cap) {
    return {
      skill: { ...skill, level: cap, xp: 0 },
      gained: 0,
      levelUps: [],
    };
  }

  let level = skill.level;
  let xp = skill.xp + gained;
  const levelUps: number[] = [];

  while (level < cap) {
    const need = xpToNextLevel(level, curve);
    if (need <= 0 || xp < need) break;
    xp -= need;
    level += 1;
    levelUps.push(level);
  }

  if (level >= cap) {
    level = cap;
    xp = 0;
  }

  return {
    skill: { ...skill, level, xp },
    gained,
    levelUps,
  };
}

export function rankBracketForLevel(
  level: number,
  brackets: readonly RankBracket[],
): RankBracket {
  const found = brackets.find(
    (bracket) => level >= bracket.min_level && level <= bracket.max_level,
  );
  return found ?? brackets[0]!;
}

/**
 * Progress inside the rank bracket, 0–100.
 * `(level - min + step) / (max - min + 1)`, where `step` is xp/xp_to_next
 * and a capped level counts as a full step.
 */
export function rankProgressPercent(
  level: number,
  xp: number,
  xpToNext: number,
  bracket: RankBracket,
): number {
  const span = bracket.max_level - bracket.min_level + 1;
  if (span <= 0) return 0;
  const step = xpToNext > 0 ? Math.max(0, xp) / xpToNext : 1;
  const raw = (level - bracket.min_level + step) / span;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

/** Progress toward the next level. The level-10 cap is 100. */
export function levelProgressPercent(
  level: number,
  xp: number,
  curve: readonly SkillLevelXp[],
): number {
  const need = xpToNextLevel(level, curve);
  if (need <= 0) return 100;
  return Math.round(Math.max(0, Math.min(1, xp / need)) * 100);
}

export function formatRankLabel(
  skillName: string,
  rankLabel: string,
  percent: number,
): string {
  return `${skillName}: ${rankLabel} ${percent}%`;
}

/** `12/40 XP`, or `tối đa` once the level cap has no next step. */
export function formatSkillXpLine(xp: number, xpToNext: number): string {
  if (xpToNext <= 0) return "tối đa";
  return `${xp}/${xpToNext} XP`;
}

export type SkillProgress = {
  id: SkillId;
  name: string;
  icon: string;
  level: number;
  xp: number;
  xpToNext: number;
  levelPercent: number;
  rankId: string;
  rankLabel: string;
  rankPercent: number;
  /** Same headline the skill popup renders. */
  summary: string;
  xpLine: string;
};

/**
 * One row per catalog skill, in catalog order. Missing saves fall back to
 * level 1 with 0 XP so every surface shows the same five skills.
 */
export function skillProgressList(
  playerSkills: readonly PlayerSkill[],
  catalog: Pick<SimCatalog, "skills" | "skillLevelXp" | "config">,
): SkillProgress[] {
  return catalog.skills.map((def) => {
    const row = playerSkills.find((skill) => skill.skill_id === def.id) ?? {
      skill_id: def.id,
      level: 1,
      xp: 0,
    };
    const bracket = rankBracketForLevel(row.level, catalog.config.rank_brackets);
    const xpToNext = xpToNextLevel(row.level, catalog.skillLevelXp);
    const rankPercent = rankProgressPercent(row.level, row.xp, xpToNext, bracket);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      level: row.level,
      xp: row.xp,
      xpToNext,
      levelPercent: levelProgressPercent(row.level, row.xp, catalog.skillLevelXp),
      rankId: bracket.id,
      rankLabel: bracket.label,
      rankPercent,
      summary: formatRankLabel(def.name, bracket.label, rankPercent),
      xpLine: formatSkillXpLine(row.xp, xpToNext),
    };
  });
}

export function studyBlockReason(
  money: number,
  energy: number,
  activity: Pick<StudyActivity, "price" | "energy">,
): string | null {
  const needsMoney = money < activity.price;
  const needsEnergy = energy < activity.energy;
  if (needsMoney && needsEnergy) return "Không đủ tiền và năng lượng";
  if (needsMoney) return "Không đủ tiền";
  if (needsEnergy) return "Không đủ năng lượng";
  return null;
}

export function skillXpEvents(
  skillId: SkillId,
  applied: XpApplyResult,
  brackets: readonly RankBracket[],
): GameEvent[] {
  const events: GameEvent[] = [];
  if (applied.gained > 0) {
    events.push({
      type: "skillXpGained",
      skillId,
      amount: applied.gained,
      level: applied.skill.level,
      xp: applied.skill.xp,
    });
  }
  for (const level of applied.levelUps) {
    events.push({
      type: "skillLevelUp",
      skillId,
      level,
      rankId: rankBracketForLevel(level, brackets).id,
    });
  }
  return events;
}
