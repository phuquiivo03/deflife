import type {
  CareerMilestone,
  JobTemplate,
  JobTemplateRequirement,
  PlayerJob,
  PlayerRow,
  PlayerSkill,
  SkillDef,
} from "../career/types";

/** Highest freelance milestone, used as the profile bar's full mark. */
export function freelanceGoal(
  milestones: readonly Pick<CareerMilestone, "freelance_completed">[],
): number {
  let max = 0;
  for (const row of milestones) {
    if (row.freelance_completed > max) max = row.freelance_completed;
  }
  return max;
}

export type JobBlock = {
  ok: boolean;
  missing: string[];
};

export function jobRequirementsFor(
  templateId: string,
  requirements: readonly JobTemplateRequirement[],
): JobTemplateRequirement[] {
  return requirements.filter((row) => row.template_id === templateId);
}

export function jobEligibility(
  player: Pick<PlayerRow, "energy" | "reputation" | "freelance_completed">,
  skills: readonly PlayerSkill[],
  template: JobTemplate,
  requirements: readonly JobTemplateRequirement[],
  skillNames: ReadonlyMap<string, string>,
): JobBlock {
  const missing: string[] = [];

  if (player.freelance_completed < template.unlock_freelance_completed) {
    missing.push(
      `Cần hoàn thành ${template.unlock_freelance_completed} freelance`,
    );
  }
  if (player.reputation < template.min_reputation) {
    missing.push(`Cần ${template.min_reputation} uy tín`);
  }
  if (player.energy < template.energy) {
    missing.push(`Cần ${template.energy} năng lượng`);
  }

  for (const req of requirements) {
    const skill = skills.find((row) => row.skill_id === req.skill_id);
    if (!skill || skill.level < req.min_level) {
      const name = skillNames.get(req.skill_id) ?? req.skill_id;
      missing.push(`Cần ${name} cấp ${req.min_level}`);
    }
  }

  return { ok: missing.length === 0, missing };
}

export function skillNameMap(skills: readonly SkillDef[]): Map<string, string> {
  return new Map(skills.map((skill) => [skill.id, skill.name]));
}

/** Deterministic Fisher–Yates. Same seed and list always return the same order. */
export function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const arr = items.slice();
  let state = seed >>> 0;
  if (state === 0) state = 1;
  for (let i = arr.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const swap = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = swap;
  }
  return arr;
}

/**
 * Freelance templates only. When the pool has both an eligible and a locked
 * template, the sample keeps at least one of each, then fills from the
 * day-seeded shuffle without repeating a template.
 */
export function selectBoardTemplates(
  templates: readonly JobTemplate[],
  day: number,
  count: number,
  isEligible: (template: JobTemplate) => boolean,
): JobTemplate[] {
  const freelance = templates
    .filter((template) => template.job_type === "freelance")
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  const shuffled = shuffleSeeded(freelance, day);
  const size = Math.max(0, Math.min(count, shuffled.length));
  const picked: JobTemplate[] = [];

  const eligible = shuffled.find((template) => isEligible(template));
  const locked = shuffled.find((template) => !isEligible(template));
  if (eligible && size > 0) picked.push(eligible);
  if (locked && picked.length < size) picked.push(locked);

  for (const template of shuffled) {
    if (picked.length >= size) break;
    if (picked.some((row) => row.id === template.id)) continue;
    picked.push(template);
  }
  return picked;
}

export function offerJob(template: JobTemplate, day: number): PlayerJob {
  return {
    id: `job-${day}-${template.id}`,
    template_id: template.id,
    job_type: template.job_type,
    status: "offered",
    hours_required: template.hours,
    progress_hours: 0,
    bugs: 0,
    pay: template.pay,
    offered_day: day,
    accepted_day: null,
    deadline_day: day + template.deadline_days,
    finished_day: null,
    missed_days: 0,
  };
}

export function boardHasToday(
  jobs: readonly PlayerJob[],
  day: number,
): boolean {
  return jobs.some(
    (job) =>
      job.offered_day === day &&
      (job.status === "offered" || job.status === "completed"),
  );
}

export function visibleBoardJobs(
  jobs: readonly PlayerJob[],
  day: number,
): PlayerJob[] {
  return jobs.filter(
    (job) =>
      job.offered_day === day &&
      (job.status === "offered" || job.status === "completed"),
  );
}
