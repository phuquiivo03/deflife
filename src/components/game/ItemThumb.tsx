"use client";

import { useEffect, useRef } from "react";
import type { LoadedAtlas } from "@/game/render/atlas";
import { cn } from "@/lib/utils";

type Props = {
  atlas: LoadedAtlas | null;
  sprite?: string;
  label: string;
  selected?: boolean;
  badge?: string;
  onClick?: () => void;
};

export function ItemThumb({
  atlas,
  sprite,
  label,
  selected,
  badge,
  onClick,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    if (!atlas || !sprite) {
      ctx.strokeStyle = "#ccc";
      ctx.strokeRect(8, 8, 32, 32);
      return;
    }
    const frame = atlas.getFrame(sprite);
    const scale = Math.max(
      1,
      Math.floor(Math.min(40 / frame.frame.w, 40 / frame.frame.h)),
    );
    const dw = frame.frame.w * scale;
    const dh = frame.frame.h * scale;
    const dx = Math.floor((48 - dw) / 2);
    const dy = Math.floor((48 - dh) / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      atlas.image,
      frame.frame.x,
      frame.frame.y,
      frame.frame.w,
      frame.frame.h,
      dx,
      dy,
      dw,
      dh,
    );
  }, [atlas, sprite]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border bg-zinc-50 p-1",
        selected ? "border-zinc-900 ring-2 ring-zinc-400" : "border-zinc-200",
      )}
    >
      <canvas ref={ref} width={48} height={48} className="pixelated" />
      {badge && (
        <span className="absolute -right-1 -top-1 rounded bg-zinc-800 px-1 text-[9px] text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
