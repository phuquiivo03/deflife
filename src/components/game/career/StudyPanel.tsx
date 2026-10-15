"use client";

import { SIM_CATALOG } from "@/game/career/content";
import { studyBlockReason } from "@/game/knowledge/logic";
import { useGameStore } from "@/game/state/store";
import { formatVnd } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "../PixelIcon";
import { BlockedButton } from "./BlockedButton";

export function StudyPanel({ iconFiles }: { iconFiles: readonly string[] }) {
  const money = useGameStore((s) => s.career.players.money);
  const energy = useGameStore((s) => s.career.players.energy);
  const buyCourse = useGameStore((s) => s.buyCourse);
  const skills = SIM_CATALOG.skills;

  return (
    <ul className="flex flex-col gap-2">
      {SIM_CATALOG.studyActivities.map((activity, index) => {
        const skill = skills.find((row) => row.id === activity.skill_id);
        const xp = SIM_CATALOG.studyActivityXp
          .filter((row) => row.activity_id === activity.id)
          .reduce((sum, row) => sum + row.xp, 0);
        const reason = studyBlockReason(money, energy, activity);
        return (
          <li
            key={activity.id}
            data-testid={`course-card-${activity.id}`}
            className="card-slide flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--panel-border)] bg-white/50 p-2"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <PixelIcon name={activity.icon} size={44} alt="" files={iconFiles} />
            <div className="min-w-0 flex-1">
              <p className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
                {activity.name}
              </p>
              <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
                {skill?.name} · {formatVnd(activity.price)} · {activity.hours} giờ ·{" "}
                {activity.energy} năng lượng · {xp} XP
              </p>
            </div>
            {reason ? (
              <BlockedButton label="Mua" reason={reason} testId={`course-buy-${activity.id}`} />
            ) : (
              <Button
                type="button"
                size="sm"
                showArrow={false}
                data-testid={`course-buy-${activity.id}`}
                onClick={() => buyCourse(activity.id)}
              >
                Mua
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
