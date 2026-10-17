"use client";

import { SIM_CATALOG } from "@/game/career/content";
import { acceptedJobs, daysUntilDeadline, deadlineIsUrgent } from "@/game/jobs/logic";
import { LIFE } from "@/game/life/content";
import { useGameStore } from "@/game/state/store";
import { snapshot } from "@/game/time";
import { formatVnd } from "@/lib/format-currency";
import { Modal } from "@/components/ui/modal";
import { PixelButton } from "@/components/ui/button";

function difficultyLabel(tier: number): string {
  if (tier <= 1) return "Dễ";
  if (tier === 2) return "Vừa";
  return "Khó";
}

export function JobManageBoard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const jobs = useGameStore((s) => s.career.player_jobs);
  const day = useGameStore((s) => snapshot(s.totalMinutes).day);
  const openTask = useGameStore((s) => s.openTask);
  const accepted = acceptedJobs(jobs);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Quản lý job" testId="job-manage" closeLabel="Đóng">
      {accepted.length === 0 ? (
        <p className="font-galmuri-9 text-galmuri-body text-[var(--muted-foreground)]">Chưa nhận job nào.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {accepted.map((job) => {
            const template = SIM_CATALOG.jobTemplates.find((row) => row.id === job.template_id);
            const daysLeft = daysUntilDeadline(job.deadline_day, day);
            const urgent = deadlineIsUrgent(daysLeft, LIFE.job_remind_days);
            const leftLabel = daysLeft == null ? "—" : daysLeft === 1 ? "còn 1 ngày" : `còn ${daysLeft} ngày`;
            return (
              <li
                key={job.id}
                data-testid={`job-row-${job.id}`}
                className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--panel-border)] bg-white/50 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
                    {template?.name ?? job.template_id}
                  </p>
                  <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
                    {formatVnd(job.pay)} · {difficultyLabel(template?.tier ?? 1)}
                  </p>
                  <p
                    data-testid={`job-deadline-${job.id}`}
                    data-urgent={urgent ? "1" : "0"}
                    className={
                      urgent
                        ? "font-galmuri-7 text-galmuri-small text-[var(--accent-coral)]"
                        : "font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]"
                    }
                  >
                    {leftLabel}
                  </p>
                </div>
                <PixelButton
                  type="button"
                  variant="secondary"
                  data-testid={`job-do-${job.id}`}
                  onClick={() => openTask(job.id)}
                >
                  Làm
                </PixelButton>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
