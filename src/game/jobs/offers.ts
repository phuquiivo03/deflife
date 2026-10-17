import type { CareerState, JobTemplate, LifeNotice, SimCatalog, StoredNoticeAction } from "../career/types";
import { SIM_CATALOG } from "../career/content";
import { LIFE } from "../life/content";
import { lifeOf } from "../life/logic";
import { formatVnd } from "@/lib/format-currency";
import { jobRequirementsFor, offerJob, shuffleSeeded, skillNameMap } from "./logic";

export const JOB_OFFER_ICON = "icon_notif_job.png";

const DIFFICULTY_LABEL = {
  easy: "Dễ",
  mid: "Vừa",
  hard: "Khó",
} as const;

export type JobDifficulty = keyof typeof DIFFICULTY_LABEL;

export function noticeActionList(notice: Pick<LifeNotice, "action" | "actions">): StoredNoticeAction[] {
  if (notice.actions && notice.actions.length > 0) return notice.actions;
  return notice.action ? [notice.action] : [];
}

export function difficultyForTier(tier: number): JobDifficulty {
  if (tier <= 1) return "easy";
  if (tier === 2) return "mid";
  return "hard";
}

export function deadlineDaysForTier(tier: number): number {
  const kind = difficultyForTier(tier);
  if (kind === "easy") return LIFE.job_deadline_easy;
  if (kind === "mid") return LIFE.job_deadline_mid;
  return LIFE.job_deadline_hard;
}

export function isJobOfferNotice(notice: LifeNotice): boolean {
  return typeof notice.jobId === "string" && noticeActionList(notice).includes("acceptJob");
}

function skillLine(template: JobTemplate, catalog: SimCatalog): string {
  const names = skillNameMap(catalog.skills);
  const labels = jobRequirementsFor(template.id, catalog.jobTemplateRequirements).map(
    (row) => names.get(row.skill_id) ?? row.skill_id,
  );
  return labels.length > 0 ? labels.join(", ") : "—";
}

export function jobOfferText(template: JobTemplate, catalog: SimCatalog): string {
  const days = deadlineDaysForTier(template.tier);
  const kind = DIFFICULTY_LABEL[difficultyForTier(template.tier)];
  return `${template.name} · ${skillLine(template, catalog)} · ${kind} · ${formatVnd(template.pay)} · hạn ${days} ngày`;
}

function pendingOffers(state: CareerState, day: number): LifeNotice[] {
  const notices = state.feed?.notices ?? [];
  return notices.filter((notice) => {
    if (!isJobOfferNotice(notice)) return false;
    if (day >= notice.day + LIFE.job_notice_expire_days) return false;
    const job = state.player_jobs.find((row) => row.id === notice.jobId);
    return job?.status === "offered";
  });
}

function expireJobOffers(state: CareerState, day: number): CareerState {
  const notices = state.feed?.notices ?? [];
  const drop = new Set<string>();
  const expireJobs = new Set<string>();
  for (const notice of notices) {
    if (!isJobOfferNotice(notice)) continue;
    if (day < notice.day + LIFE.job_notice_expire_days) continue;
    drop.add(notice.id);
    if (notice.jobId) expireJobs.add(notice.jobId);
  }
  if (drop.size === 0) return state;
  return {
    ...state,
    player_jobs: state.player_jobs.map((job) =>
      expireJobs.has(job.id) && job.status === "offered" ? { ...job, status: "expired" } : job,
    ),
    feed: state.feed
      ? { ...state.feed, notices: notices.filter((notice) => !drop.has(notice.id)) }
      : state.feed,
  };
}

function pickTemplate(state: CareerState, catalog: SimCatalog, day: number): JobTemplate | null {
  const busy = new Set(
    state.player_jobs
      .filter((job) => job.status === "offered" || job.status === "active")
      .map((job) => job.template_id),
  );
  const pool = catalog.jobTemplates.filter(
    (template) => template.job_type === "freelance" && !busy.has(template.id),
  );
  if (pool.length === 0) return null;
  const shuffled = shuffleSeeded(pool, day * 997 + state.player_jobs.length);
  return shuffled[0] ?? null;
}

function postOffer(state: CareerState, template: JobTemplate, day: number, minute: number, catalog: SimCatalog): CareerState {
  const days = deadlineDaysForTier(template.tier);
  const offered = offerJob(template, day);
  const job = {
    ...offered,
    id: `job-${day}-${template.id}-${state.player_jobs.length}`,
    deadline_day: day + days,
  };
  const actions: StoredNoticeAction[] = ["acceptJob", "dismissNotice"];
  const notice: LifeNotice = {
    id: `job-offer-${job.id}`,
    day,
    minute,
    severity: "info",
    icon: JOB_OFFER_ICON,
    text: jobOfferText(template, catalog),
    action: "acceptJob",
    actions,
    jobId: job.id,
    read: false,
  };
  const notices = [...(state.feed?.notices ?? []), notice];
  return {
    ...state,
    player_jobs: [...state.player_jobs, job],
    feed: state.feed ? { ...state.feed, notices } : state.feed,
  };
}

/** One waking slot. At most one new job notice every `job_notice_every_slots` slots, and at most `job_notice_pending_max` open offers. */
export function tickJobOffers(
  state: CareerState,
  day: number,
  minute: number,
  catalog: SimCatalog = SIM_CATALOG,
): CareerState {
  const expired = expireJobOffers(state, day);
  const life = lifeOf(expired);
  const slots = life.jobNoticeSlots + 1;
  if (slots < LIFE.job_notice_every_slots) {
    return { ...expired, life: { ...life, jobNoticeSlots: slots } };
  }
  const ready = { ...expired, life: { ...life, jobNoticeSlots: 0 } };
  if (pendingOffers(ready, day).length >= LIFE.job_notice_pending_max) return ready;
  const template = pickTemplate(ready, catalog, day);
  if (!template || !ready.feed) return ready;
  return postOffer(ready, template, day, minute, catalog);
}

function noticeById(state: CareerState, noticeId?: string, action?: StoredNoticeAction): LifeNotice | null {
  const notices = state.feed?.notices ?? [];
  if (noticeId) return notices.find((notice) => notice.id === noticeId) ?? null;
  for (let i = notices.length - 1; i >= 0; i -= 1) {
    const notice = notices[i];
    if (!notice) continue;
    if (action && noticeActionList(notice).includes(action)) return notice;
  }
  return null;
}

function withoutNotice(state: CareerState, noticeId: string, expireJob: boolean): CareerState {
  const notice = state.feed?.notices.find((row) => row.id === noticeId);
  const notices = (state.feed?.notices ?? []).filter((row) => row.id !== noticeId);
  const jobId = notice?.jobId;
  return {
    ...state,
    player_jobs:
      expireJob && jobId
        ? state.player_jobs.map((job) =>
            job.id === jobId && job.status === "offered" ? { ...job, status: "expired" } : job,
          )
        : state.player_jobs,
    feed: state.feed ? { ...state.feed, notices } : state.feed,
  };
}

/** Nhận. The job becomes active and the notice closes. The terminal stays closed. */
export function acceptJobFromNotice(state: CareerState, noticeId?: string): CareerState {
  const notice = noticeById(state, noticeId, "acceptJob");
  if (!notice?.jobId) return state;
  const job = state.player_jobs.find((row) => row.id === notice.jobId);
  if (!job || job.status !== "offered") return withoutNotice(state, notice.id, false);
  const accepted = state.player_jobs.map((row) =>
    row.id === job.id
      ? { ...row, status: "active" as const, accepted_day: state.players.game_day }
      : row,
  );
  return withoutNotice({ ...state, player_jobs: accepted }, notice.id, false);
}

/** Bỏ qua. The notice closes and an unaccepted job expires. */
export function dismissNoticeById(state: CareerState, noticeId?: string): CareerState {
  const notice = noticeById(state, noticeId, "dismissNotice");
  if (!notice) return state;
  return withoutNotice(state, notice.id, true);
}
