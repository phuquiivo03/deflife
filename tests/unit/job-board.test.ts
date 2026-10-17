import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { acceptedJobs, daysUntilDeadline, deadlineIsUrgent } from "@/game/jobs/logic";
import { LIFE } from "@/game/life/content";
import type { PlayerJob } from "@/game/career/types";

function job(status: PlayerJob["status"], id = "job-1"): PlayerJob {
  return {
    id,
    template_id: "landing-html",
    job_type: "freelance",
    status,
    hours_required: 2,
    progress_hours: 0,
    bugs: 0,
    pay: 180_000,
    offered_day: 1,
    accepted_day: status === "active" ? 1 : null,
    deadline_day: 3,
    finished_day: null,
    missed_days: 0,
    task_run: null,
  };
}

describe("job management board", () => {
  it("lists accepted jobs and marks a deadline red at one day", () => {
    expect(LIFE.job_remind_days).toBe(1);
    const rows = acceptedJobs([job("offered", "a"), job("active", "b"), job("completed", "c")]);
    expect(rows.map((row) => row.id)).toEqual(["b"]);
    expect(daysUntilDeadline(3, 2)).toBe(1);
    expect(deadlineIsUrgent(1, LIFE.job_remind_days)).toBe(true);
    expect(deadlineIsUrgent(2, LIFE.job_remind_days)).toBe(false);
    expect(daysUntilDeadline(null, 2)).toBeNull();
  });

  it("opens from Việc làm as a modal and starts the existing terminal from Làm", () => {
    const board = readFileSync(join(process.cwd(), "src/components/game/career/JobManageBoard.tsx"), "utf8");
    const chrome = readFileSync(join(process.cwd(), "src/components/game/career/CareerChrome.tsx"), "utf8");
    expect(board).toContain('title="Quản lý job"');
    expect(board).toContain("PixelButton");
    expect(board).toContain("openTask(job.id)");
    expect(board).toContain("Chưa nhận job nào.");
    expect(chrome).toContain("JobManageBoard");
    expect(chrome).toContain('panel === "jobs"');
    expect(chrome).not.toContain("JobBoardPanel");
  });
});
