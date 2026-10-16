import type { TaskBuildChoice, TaskRun, TaskTicketChoice } from "./types";

export function freshRun(seed: number): TaskRun {
  return {
    step: "ticket",
    seed,
    ticket: null,
    build: null,
    event_id: null,
    bugs_total: 0,
    bugs_caught: 0,
    retries: 0,
    outcome: null,
    time_bonus_sec: 0,
  };
}

export function applyTicketChoice(
  run: TaskRun,
  choice: TaskTicketChoice,
  eventId: string | null,
  extraSec: number,
): TaskRun {
  return {
    ...run,
    step: "build",
    ticket: choice,
    event_id: eventId,
    time_bonus_sec: extraSec,
    outcome: null,
  };
}

export function applyBuildChoice(
  run: TaskRun,
  choice: TaskBuildChoice,
  bugsTotal: number,
  timeDeltaSec: number,
): TaskRun {
  return {
    ...run,
    build: choice,
    bugs_total: bugsTotal,
    bugs_caught: 0,
    time_bonus_sec: run.time_bonus_sec + timeDeltaSec,
  };
}

export function applyBeginTest(run: TaskRun): TaskRun {
  return { ...run, step: "test", bugs_caught: 0, outcome: null };
}

export function applyCatch(run: TaskRun): TaskRun {
  if (run.step !== "test") return run;
  return { ...run, bugs_caught: Math.min(run.bugs_total, run.bugs_caught + 1) };
}

export function isCleared(run: TaskRun): boolean {
  return run.bugs_total > 0 && run.bugs_caught >= run.bugs_total;
}

export function applyTestFail(run: TaskRun): TaskRun {
  const escaped = Math.max(0, run.bugs_total - run.bugs_caught);
  return {
    ...run,
    step: "result",
    outcome: "fail",
    bugs_caught: run.bugs_total - escaped,
  };
}

export function applyRetry(run: TaskRun): TaskRun {
  return {
    ...run,
    step: "test",
    outcome: null,
    bugs_caught: 0,
    retries: run.retries + 1,
  };
}

export function canRetry(run: TaskRun, maxRetries: number): boolean {
  return run.step === "result" && run.outcome === "fail" && run.retries < maxRetries;
}
