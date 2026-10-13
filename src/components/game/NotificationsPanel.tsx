"use client";

import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelCard, PanelCardTitle } from "@/components/ui/panel-card";
import { PixelIcon } from "./PixelIcon";
import type { IconName } from "@/lib/pixel-assets";

const NOTIFICATIONS: {
  icon: IconName;
  title: string;
  body: string;
}[] = [
  {
    icon: "stars",
    title: "Nhiệm vụ hoàn thành",
    body: "Bạn đã nộp bài lab Frontend đúng hạn.",
  },
  {
    icon: "rent",
    title: "Vật phẩm mới",
    body: "Mua được bàn gấp mới cho phòng sinh viên.",
  },
  {
    icon: "skill_up",
    title: "Kỹ năng tăng",
    body: "Frontend +2 sau buổi pair programming.",
  },
];

export function NotificationsPanel() {
  return (
    <PanelCard className="flex h-full min-h-0 flex-col gap-3 p-4">
      <PanelCardTitle
        icon={<Bell className="h-5 w-5 text-[var(--accent-violet)]" strokeWidth={2} />}
      >
        Thông báo
      </PanelCardTitle>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-2 pr-2">
          {NOTIFICATIONS.map((n) => (
            <li key={n.title}>
              <PanelCard className="flex gap-2.5 p-3">
                <PixelIcon name={n.icon} size={22} className="mt-0.5" />
                <div className="min-w-0">
                  <p className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
                    {n.title}
                  </p>
                  <p className="mt-1 font-galmuri-9 text-galmuri-body text-[var(--muted-foreground)]">
                    {n.body}
                  </p>
                </div>
              </PanelCard>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </PanelCard>
  );
}
