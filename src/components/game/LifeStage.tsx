"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { useEffect, useState } from "react";
import { LIFE_EVENTS, lifeEventById } from "@/game/life/events-content";
import { diaryWhen } from "@/game/life/events";
import { m5AssetPath, type M5AssetKey } from "@/game/life/assets";
import type { LifeDiary } from "@/game/career/types";
import { useGameStore } from "@/game/state/store";
import { Button } from "@/components/ui/button";
import { HungerDock } from "./FoodPopup";
import { formatVnd } from "@/lib/format-currency";

function art(key: string): string {
  return m5AssetPath(key as M5AssetKey);
}

const CONFETTI = [
  { left: "8%", delay: "0ms" },
  { left: "18%", delay: "-120ms" },
  { left: "30%", delay: "-40ms" },
  { left: "42%", delay: "-200ms" },
  { left: "54%", delay: "-80ms" },
  { left: "66%", delay: "-160ms" },
  { left: "76%", delay: "-20ms" },
  { left: "88%", delay: "-240ms" },
] as const;

export function LifeStage() {
  const pendingId = useGameStore((s) => s.career.feed?.pendingId ?? null);
  const diary = useGameStore((s) => s.career.feed?.diary ?? null);
  const banner = useGameStore((s) => s.lifeBanner);
  const chooseLife = useGameStore((s) => s.chooseLife);
  const dismissDiary = useGameStore((s) => s.dismissDiary);
  const syncLifeSurface = useGameStore((s) => s.syncLifeSurface);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    syncLifeSurface();
  }, [syncLifeSurface]);

  useEffect(() => {
    if (!banner) return;
    const delay = Math.max(0, banner.until - Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const event = pendingId ? lifeEventById(pendingId) : null;
  const showBanner = banner != null && banner.until > now;

  return (
    <>
      <HungerDock />
      {showBanner ? (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" data-testid="life-banner">
          <div className="life-banner-dim absolute inset-0" data-testid="life-banner-dim" />
          <div
            className="life-banner relative z-10 mx-auto mt-16 w-[min(1200px,calc(100%-1.5rem))]"
            style={{ animationDuration: `${LIFE_EVENTS.banner_enter_ms}ms` }}
          >
            <div
              className="life-banner-sparkle"
              style={{ animationDuration: `${LIFE_EVENTS.banner_spark_ms}ms` }}
            >
              <div className="life-banner-plate" data-testid="life-banner-plate">
                <p className="px-3 text-center font-galmuri-11 text-galmuri-title text-white" data-testid="life-banner-label">
                  {banner.label}
                </p>
              </div>
            </div>
            <div className="life-confetti-field" data-testid="life-confetti">
              {CONFETTI.map((piece) => (
                <span
                  key={piece.left}
                  className="life-confetti-piece"
                  style={{
                    left: piece.left,
                    animationDuration: `${LIFE_EVENTS.banner_confetti_ms}ms`,
                    animationDelay: `${piece.delay}, ${piece.delay}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {event ? (
        <div className="absolute inset-x-0 bottom-0 z-20 flex h-1/3 min-h-[168px] items-end p-2" data-testid="life-dialog">
          <div className="life-dialog flex w-full gap-3 p-3">
            {event.portrait ? (
              <img
                src={art(event.portrait)}
                width={96}
                height={96}
                alt=""
                className="pixel-img h-24 w-24 shrink-0"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <p className="font-galmuri-9 text-galmuri-body text-[#F4EBD9]">{event.text}</p>
              <div className="flex flex-wrap gap-2">
                {event.choices.map((choice) => (
                  <Button
                    key={choice.id}
                    type="button"
                    size="sm"
                    showArrow={false}
                    className="min-h-11"
                    data-testid={`life-choice-${choice.id}`}
                    onClick={() => chooseLife(choice.id)}
                  >
                    {choice.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {diary ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-3" data-testid="life-diary">
          <div className="life-notepad w-full max-w-sm p-3">
            <div className="life-notepad-title font-galmuri-7 text-galmuri-small">
              <p className="w-full" data-testid="diary-title">
                nhat_ky_ngay_{diary.day}.txt
              </p>
              <div className="flex shrink-0">
                <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11 text-white" aria-label="Thu nhỏ" data-testid="diary-min">
                  _
                </Button>
                <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11 text-white" aria-label="Phóng to" data-testid="diary-max">
                  □
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="min-h-11 min-w-11 text-white"
                  aria-label="Đóng"
                  data-testid="life-diary-close"
                  onClick={dismissDiary}
                >
                  x
                </Button>
              </div>
            </div>
            <ul className="mt-2 space-y-1 font-galmuri-7 text-galmuri-small text-[var(--foreground)]">
              <li data-testid="diary-when">{diaryWhen(diary)}</li>
              <li data-testid="diary-earned" className="text-[var(--accent-mint)]">
                Kiếm được +{formatVnd(diary.earned)}
              </li>
              <li data-testid="diary-spent" className="text-[var(--accent-coral)]">
                Đã tiêu −{formatVnd(diary.spent)}
              </li>
              <DiarySpends diary={diary} />
              <li data-testid="diary-left">Còn lại {formatVnd(diary.remaining)}</li>
              <li data-testid="diary-stats">
                XP {signed(diary.xp)} · Sức khỏe {signed(diary.health)} · Tinh thần {signed(diary.mood)} · Năng lượng{" "}
                {signed(diary.energy)}
              </li>
              <li data-testid="diary-pin">{diary.pin || "Chưa ghim món."}</li>
            </ul>
            <p className="mt-2 font-galmuri-7 text-galmuri-small text-[var(--foreground)]">{diary.line}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function signed(value: number): string {
  const shown = Math.round(value);
  return shown > 0 ? `+${shown}` : `${shown}`;
}

function DiarySpends({ diary }: { diary: LifeDiary }) {
  const parts: { id: string; text: string }[] = [];
  if (diary.food > 0) parts.push({ id: "diary-food", text: `Ăn −${formatVnd(diary.food)}` });
  if (diary.rent > 0) parts.push({ id: "diary-rent", text: `Trọ −${formatVnd(diary.rent)}` });
  if (diary.shop > 0) parts.push({ id: "diary-shop", text: `Mua đồ −${formatVnd(diary.shop)}` });
  if (parts.length === 0) return null;
  return (
    <li data-testid="diary-breakdown">
      {parts.map((part, index) => (
        <span key={part.id}>
          {index > 0 ? " · " : null}
          <span data-testid={part.id}>{part.text}</span>
        </span>
      ))}
    </li>
  );
}

export function LifeRoomFx() {
  const health = useGameStore((s) => s.career.players.health);
  const mood = useGameStore((s) => s.career.players.mood);
  const energy = useGameStore((s) => s.career.players.energy);
  const pendingId = useGameStore((s) => s.career.feed?.pendingId ?? null);
  const bubble = useGameStore((s) => s.lifeBubble);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!bubble) return;
    const delay = Math.max(0, bubble.until - Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [bubble]);

  const emote =
    health < 30 ? "emote_cough.png" : mood < 15 ? "emote_cloud.png" : energy < 15 ? "emote_sweat.png" : null;
  const showBubble = bubble != null && bubble.until > now;

  return (
    <>
      {pendingId ? <div className="absolute inset-0 z-10 bg-black/45" data-testid="life-dim" /> : null}
      {emote ? (
        <img
          src={art(emote)}
          width={32}
          height={32}
          alt=""
          className="pixel-img pointer-events-none absolute left-1/2 top-[22%] z-10"
          data-testid="life-emote"
          data-emote={emote}
        />
      ) : null}
      {showBubble ? (
        <p className="life-bubble pointer-events-none absolute left-1/2 top-[8%] z-10 max-w-[180px] px-3 py-2 font-galmuri-7 text-galmuri-small text-[var(--foreground)]" data-testid="life-bubble">
          {bubble.text}
        </p>
      ) : null}
    </>
  );
}
