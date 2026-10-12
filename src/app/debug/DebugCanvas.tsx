"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getCatalog, getRoom } from "@/game/content";
import { resolveScene } from "@/game/layout/resolveScene";
import { loadAtlas } from "@/game/render/atlas";
import { createRenderer } from "@/game/render/canvasRenderer";
import { buildSlotIndex } from "@/game/state/store";
import type { StageId } from "@/game/config";
import { STAGES, WORLD } from "@/game/config";

export function DebugCanvas() {
  const params = useSearchParams();
  const stage = (params.get("stage") as StageId) || "student";
  const scale = Number(params.get("scale") || "3");
  const character = params.get("character") !== "0";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const room = useMemo(
    () => getRoom(STAGES.includes(stage) ? stage : "student"),
    [stage],
  );
  const catalog = useMemo(() => getCatalog(), []);

  useEffect(() => {
    let renderer: ReturnType<typeof createRenderer> | null = null;
    loadAtlas().then((atlas) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderer = createRenderer(canvas, atlas);
      const { entries } = resolveScene(
        room,
        catalog,
        {},
        atlas.frameLookup,
        { showCharacter: character, slotIndex: buildSlotIndex(room.id) },
      );
      renderer.setView({
        mode: "full",
        scale,
        viewW: WORLD.w,
        viewH: WORLD.h,
        cameraX: 0,
        cssW: (WORLD.w * scale) / (window.devicePixelRatio || 1),
        cssH: (WORLD.h * scale) / (window.devicePixelRatio || 1),
        dpr: window.devicePixelRatio || 1,
      });
      renderer.setScene(entries, `/assets/${room.background}.png`);
    });
    return () => renderer?.destroy();
  }, [room, catalog, scale, character]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#15111c] p-4">
      <canvas ref={canvasRef} className="pixelated" data-testid="debug-canvas" />
    </div>
  );
}
