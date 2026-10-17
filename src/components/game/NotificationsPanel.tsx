"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { m5AssetPath, type M5AssetKey } from "@/game/life/assets";
import { unreadCount } from "@/game/life/events";
import { useGameStore } from "@/game/state/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelCard, PanelCardTitle } from "@/components/ui/panel-card";

const ACTION_LABEL = {
  payRent: "Trả trọ",
  viewJobs: "Xem job",
  openStore: "Mở store",
} as const;

function clock(minute: number): string {
  const hour = Math.floor(minute / 60) % 24;
  const rest = minute % 60;
  return `${String(hour).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function NotificationsPanel() {
  const notices = useGameStore((s) => s.career.feed?.notices ?? []);
  const career = useGameStore((s) => s.career);
  const unread = unreadCount(career);
  const readNotice = useGameStore((s) => s.readNotice);
  const readAll = useGameStore((s) => s.readAllNotices);
  const runNoticeAction = useGameStore((s) => s.runNoticeAction);
  const ordered = [...notices].reverse();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <PanelCardTitle>Thông báo</PanelCardTitle>
        {unread > 0 ? (
          <span className="relative inline-flex" data-testid="notice-badge" data-count={unread}>
            <img src={m5AssetPath("ui_badge_unread.png")} width={20} height={20} alt="" className="pixel-img" />
            <span className="absolute inset-0 flex items-center justify-center font-galmuri-7 text-[8px] text-white">
              {unread > 9 ? "9" : unread}
            </span>
          </span>
        ) : null}
      </div>
      {unread > 0 ? (
        <Button type="button" size="sm" variant="outline" showArrow={false} onClick={readAll}>
          Đã đọc
        </Button>
      ) : null}
      <ScrollArea className="min-h-0 flex-1">
        {ordered.length === 0 ? (
          <p className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]" data-testid="notice-empty">
            Chưa có thông báo.
          </p>
        ) : (
          <ul className="space-y-2 pr-2" data-testid="notice-list">
            {ordered.map((notice) => (
              <li key={notice.id}>
                <PanelCard
                  className="flex gap-2.5 p-3"
                  data-testid={`notice-${notice.id}`}
                  data-read={notice.read ? "1" : "0"}
                >
                  <button type="button" className="flex min-w-0 flex-1 gap-2 text-left" onClick={() => readNotice(notice.id)}>
                    <img
                      src={m5AssetPath(notice.icon as M5AssetKey)}
                      width={32}
                      height={32}
                      alt=""
                      className="pixel-img mt-0.5 h-8 w-8 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
                        {clock(notice.minute)}
                      </span>
                      <span className="mt-1 block font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
                        {notice.text}
                      </span>
                    </span>
                  </button>
                  {notice.action ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      showArrow={false}
                      className="min-h-11 shrink-0"
                      data-testid={`notice-action-${notice.action}`}
                      onClick={() => runNoticeAction(notice.action!)}
                    >
                      {ACTION_LABEL[notice.action]}
                    </Button>
                  ) : null}
                </PanelCard>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
