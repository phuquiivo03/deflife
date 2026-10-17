"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { m5AssetPath, m51AssetPath, type M5AssetKey } from "@/game/life/assets";
import { unreadCount } from "@/game/life/events";
import type { NoticeAction } from "@/game/career/types";
import { useGameStore } from "@/game/state/store";
import { Button, PixelButton } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelCard, PanelCardTitle } from "@/components/ui/panel-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  NOTICE_BADGE_COUNT_CAP,
  NOTICE_BADGE_KEY,
  NOTICE_LIST,
  actionIconFile,
  noticeActionButtonMetrics,
  noticeBadgeFile,
  noticeBadgeMetrics,
  noticeChromeStyle,
  resolveNoticeAction,
} from "./notifications.config";
import styles from "./notifications.module.css";

function clock(minute: number): string {
  const hour = Math.floor(minute / 60) % 24;
  const rest = minute % 60;
  return `${String(hour).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function NoticeActionButton({
  action,
  onRun,
}: {
  action: NoticeAction;
  onRun: (action: NoticeAction) => void;
}) {
  const control = resolveNoticeAction(action);
  const label = control?.label ?? action;
  if (!control || control.kind === "text") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        showArrow={false}
        className="min-h-11 shrink-0"
        data-testid={`notice-action-${action}`}
        data-action-kind="text"
        onClick={() => onRun(action)}
      >
        {label}
      </Button>
    );
  }

  const metrics = noticeActionButtonMetrics();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <PixelButton
            variant="icon"
            aria-label={control.label}
            className="shrink-0"
            style={{
              width: metrics.buttonPx,
              height: metrics.buttonPx,
              minWidth: metrics.buttonPx,
              minHeight: metrics.buttonPx,
            }}
            data-testid={`notice-action-${action}`}
            data-action-kind="icon"
            onClick={() => onRun(action)}
          >
            <img
              src={m51AssetPath(actionIconFile(control.iconKey))}
              alt=""
              width={metrics.glyphPx}
              height={metrics.glyphPx}
              draggable={false}
              data-icon-key={control.iconKey}
              className="pixelated block"
              style={{ width: metrics.glyphPx, height: metrics.glyphPx }}
            />
          </PixelButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" data-testid={`notice-action-tip-${action}`}>
        {control.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function NotificationsPanel() {
  const notices = useGameStore((s) => s.career.feed?.notices ?? []);
  const career = useGameStore((s) => s.career);
  const unread = unreadCount(career);
  const readNotice = useGameStore((s) => s.readNotice);
  const readAll = useGameStore((s) => s.readAllNotices);
  const runNoticeAction = useGameStore((s) => s.runNoticeAction);
  const ordered = [...notices].reverse();
  const badge = noticeBadgeMetrics();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4" style={noticeChromeStyle()}>
      <div className="flex items-center justify-between gap-2">
        <PanelCardTitle>Thông báo</PanelCardTitle>
        {unread > 0 ? (
          <span className={styles.badge} data-testid="notice-badge" data-count={unread}>
            <img
              src={m51AssetPath(noticeBadgeFile())}
              width={badge.sizePx}
              height={badge.sizePx}
              alt=""
              data-icon-key={NOTICE_BADGE_KEY}
              className="pixel-img"
              style={{ width: badge.sizePx, height: badge.sizePx }}
            />
            <span className={`font-galmuri-7 ${styles.count}`}>
              {unread > NOTICE_BADGE_COUNT_CAP ? NOTICE_BADGE_COUNT_CAP : unread}
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
          <ul className={styles.list} data-testid="notice-list">
            {ordered.map((notice) => (
              <li key={notice.id}>
                <PanelCard
                  className={styles.item}
                  data-testid={`notice-${notice.id}`}
                  data-read={notice.read ? "1" : "0"}
                >
                  <button type="button" className={styles.body} onClick={() => readNotice(notice.id)}>
                    <img
                      src={m5AssetPath(notice.icon as M5AssetKey)}
                      width={NOTICE_LIST.rowIconPx}
                      height={NOTICE_LIST.rowIconPx}
                      alt=""
                      className={`pixel-img ${styles.rowIcon}`}
                    />
                    <span className={`font-galmuri-7 ${styles.copy}`}>
                      <span className={styles.clock}>{clock(notice.minute)} </span>
                      {notice.text}
                    </span>
                  </button>
                  {notice.action ? (
                    <NoticeActionButton action={notice.action} onRun={runNoticeAction} />
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
