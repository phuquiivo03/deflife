"use client";

import { STUB_PLAYER } from "@/game/state/playerStats";
import { PixelIcon } from "./PixelIcon";
import { PixelAvatar } from "./PixelAvatar";
import { PanelCard } from "@/components/ui/panel-card";
import { StatBar } from "./StatBar";

export function PlayerInfoPanel() {
  const p = STUB_PLAYER;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <PanelCard className="flex flex-col items-center p-4">
        <div
          className="mb-3 flex items-center justify-center overflow-hidden rounded-xl border-2 border-[#2d2858] bg-[#b8d9f0] shadow-[0_0_24px_rgba(90,99,196,0.35)]"
        >
          <PixelAvatar role="player" size={96} alt={p.name} />
        </div>
        <p className="font-galmuri-11 text-galmuri-title-lg text-[var(--foreground)]">
          {p.name}
        </p>
        <p className="mt-1 font-galmuri-9 text-galmuri-body text-[var(--muted-foreground)]">
          {p.title}
        </p>
        <div className="mt-3 flex w-full items-center gap-2">
          <PixelIcon name="level" size={22} />
          <span className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
            Lv {p.level}
          </span>
          <StatBar value={p.exp} max={p.expMax} tone="exp" className="flex-1" />
        </div>
      </PanelCard>

      <div className="space-y-2">
        {(Object.keys(p.skills) as Array<keyof typeof p.skills>).map((key) => {
          const skill = p.skills[key];
          return (
            <PanelCard key={key} className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
                  <PixelIcon name={skill.icon} size={22} />
                  {skill.label}
                </span>
                <span className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">
                  {skill.value}%
                </span>
              </div>
              <StatBar value={skill.value} tone={skill.bar} />
            </PanelCard>
          );
        })}
      </div>
    </div>
  );
}
