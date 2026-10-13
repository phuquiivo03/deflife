"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Backpack, Coffee, Monitor } from "lucide-react";
import { STAGES, type StageId } from "@/game/config";
import { getRoom } from "@/game/content";
import { useGameStore } from "@/game/state/store";
import { SceneCanvas } from "./SceneCanvas";
import { CustomizePanel } from "./CustomizePanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { PlayerInfoPanel } from "./PlayerInfoPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const stageIcons: Record<StageId, React.ReactNode> = {
  student: <Backpack className="h-4 w-4" />,
  junior: <Monitor className="h-4 w-4" />,
  senior: <Coffee className="h-4 w-4" />,
};

const DESKTOP_GAME_W = 768;

type SidebarTab = "player" | "edit-room";

export function GameShell() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("edit-room");
  const searchParams = useSearchParams();
  const router = useRouter();
  const debug = searchParams.get("debug") === "1";

  const stage = useGameStore((s) => s.stage);
  const setStage = useGameStore((s) => s.setStage);
  const hydrated = useGameStore((s) => s._hasHydrated);
  const showCharacter = useGameStore((s) => s.showCharacter);
  const setShowCharacter = useGameStore((s) => s.setShowCharacter);
  const resetStage = useGameStore((s) => s.resetStage);
  const customizeOpen = useGameStore((s) => s.customizeOpen);
  const setCustomizeOpen = useGameStore((s) => s.setCustomizeOpen);
  const selectedSlot = useGameStore((s) => s.selectedSlot);
  const cycleVariant = useGameStore((s) => s.cycleVariant);
  const selectSlot = useGameStore((s) => s.selectSlot);

  useEffect(() => {
    const q = searchParams.get("stage") as StageId | null;
    if (q && STAGES.includes(q)) setStage(q);
  }, [searchParams, setStage]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", stage);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [stage, router, searchParams]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (customizeOpen) setSidebarTab("edit-room");
  }, [customizeOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setStage("student");
      if (e.key === "2") setStage("junior");
      if (e.key === "3") setStage("senior");
      if (e.key === "Escape") selectSlot(null);
      if (e.key === "c" || e.key === "C") {
        setSidebarTab("edit-room");
        setCustomizeOpen(true);
      }
      if (e.key === "d" || e.key === "D") {
        const params = new URLSearchParams(searchParams.toString());
        if (debug) params.delete("debug");
        else params.set("debug", "1");
        router.replace(`?${params.toString()}`);
      }
      if (selectedSlot && (e.key === "[" || e.key === "]")) {
        cycleVariant(selectedSlot, e.key === "]" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    setStage,
    selectSlot,
    setCustomizeOpen,
    selectedSlot,
    cycleVariant,
    debug,
    router,
    searchParams,
  ]);

  const room = getRoom(stage);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15111c] text-zinc-200">
        Loading your room…
      </div>
    );
  }

  const gameColumnStyle = isDesktop
    ? { width: DESKTOP_GAME_W, maxWidth: DESKTOP_GAME_W }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3 md:px-4">
        <span className="font-[family-name:var(--font-pixel)] text-lg tracking-tight">
          devlife
        </span>
        <Tabs
          value={stage}
          onValueChange={(v) => setStage(v as StageId)}
          className="min-w-0 flex-1"
        >
          <TabsList className="h-9 w-full max-w-xl">
            {STAGES.map((s) => (
              <TabsTrigger key={s} value={s} className="gap-1 capitalize">
                {stageIcons[s]}
                <span className="hidden sm:inline">
                  {s === "student" ? "Student · Sinh viên" : s}
                </span>
                <span className="sm:hidden">{s[0]?.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex shrink-0 items-center gap-2">
          <label className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
            Character
            <Switch
              checked={showCharacter}
              onCheckedChange={setShowCharacter}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={resetStage}>
            Reset room
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          className="order-2 flex min-h-0 flex-col border-t border-zinc-200 bg-white p-4 lg:order-1 lg:flex-1 lg:border-r lg:border-t-0"
        >
          <NotificationsPanel />
        </aside>

        <main
          className="order-1 flex shrink-0 flex-col items-center justify-center bg-[#15111c] p-2 lg:order-2"
          style={gameColumnStyle}
        >
          <div
            ref={areaRef}
            className="flex w-full items-center justify-center"
            style={
              isDesktop
                ? {
                    width: DESKTOP_GAME_W,
                    minHeight: Math.round((DESKTOP_GAME_W * 240) / 427),
                  }
                : { minHeight: 200, aspectRatio: "427 / 240" }
            }
          >
            <SceneCanvas areaRef={areaRef} debug={debug} />
          </div>
          <p className="mt-1 w-full truncate px-2 text-center text-xs text-zinc-500">
            {room.title}
            {debug ? " · debug on (D)" : ""}
          </p>
        </main>

        <aside
          className="order-3 flex min-h-0 w-full flex-col border-t border-zinc-200 bg-white lg:max-w-[400px] lg:flex-1 lg:border-l lg:border-t-0"
        >
          <div className="flex min-h-0 flex-1 flex-col p-4 lg:max-h-[calc(100vh-3.5rem)]">
            <Tabs
              value={sidebarTab}
              onValueChange={(v) => {
                setSidebarTab(v as SidebarTab);
                if (v === "edit-room") setCustomizeOpen(true);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player">Player info</TabsTrigger>
                <TabsTrigger value="edit-room">Edit room</TabsTrigger>
              </TabsList>
              <TabsContent value="player" className="mt-0 min-h-0 flex-1">
                <PlayerInfoPanel />
              </TabsContent>
              <TabsContent value="edit-room" className="mt-0 min-h-0 flex-1">
                <div className="flex max-h-[min(50vh,520px)] min-h-[240px] flex-col lg:max-h-none lg:min-h-0 lg:flex-1">
                  <CustomizePanel />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

    </div>
  );
}
