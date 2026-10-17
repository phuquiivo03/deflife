"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { useEffect, useState } from "react";
import { lifeEventById } from "@/game/life/events-content";
import { m5AssetPath, type M5AssetKey } from "@/game/life/assets";
import { useGameStore } from "@/game/state/store";
import { Button } from "@/components/ui/button";

function art(key: string): string {
  return m5AssetPath(key as M5AssetKey);
}

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
      {showBanner ? (
        <div className="life-banner pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center" data-testid="life-banner">
          <div className="relative">
            {/* Native 480×48 banner. Integer scale; narrower columns clip it. */}
            <img src={art("ui_banner.png")} width={480} height={48} alt="" className="pixel-img max-w-full" />
            <p className="absolute inset-0 flex items-center justify-center font-galmuri-9 text-galmuri-body text-white">
              {banner.label}
            </p>
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
          <div className="life-diary w-full max-w-sm p-4">
            <p className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]">Nhật ký</p>
            <ul className="mt-2 space-y-1 font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
              <li>Tiền {signed(diary.money)}đ</li>
              <li>XP {signed(diary.xp)}</li>
              <li>Sức khỏe {signed(diary.health)}</li>
              <li>Tinh thần {signed(diary.mood)}</li>
              <li>Năng lượng {signed(diary.energy)}</li>
              <li data-testid="diary-pin">{diary.pin || "Chưa ghim món."}</li>
            </ul>
            <p className="mt-2 font-galmuri-7 text-galmuri-small text-[var(--foreground)]">{diary.line}</p>
            <Button type="button" size="sm" showArrow={false} className="mt-3 min-h-11" data-testid="life-diary-close" onClick={dismissDiary}>
              Gấp lại
            </Button>
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
