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
import { DecorativeShapes } from "@/components/design/DecorativeShapes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { IconBadge } from "@/components/ui/icon-badge";
import { t } from "@/lib/locale";
import { STAGE_LABELS } from "@/lib/stage-labels";

const stageIcons: Record<StageId, React.ReactNode> = {
  student: <Backpack className="h-4 w-4" strokeWidth={2.5} />,
  junior: <Monitor className="h-4 w-4" strokeWidth={2.5} />,
  senior: <Coffee className="h-4 w-4" strokeWidth={2.5} />,
};

const stageIconTone: Record<StageId, "tertiary" | "accent" | "secondary"> = {
  student: "tertiary",
  junior: "accent",
  senior: "secondary",
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
      <div className="flex min-h-screen items-center justify-center bg-dot-grid font-heading text-lg font-extrabold text-foreground">
        Đang tải phòng của bạn…
      </div>
    );
  }

  const gameColumnStyle = isDesktop
    ? { width: DESKTOP_GAME_W, maxWidth: DESKTOP_GAME_W }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-dot-grid">
      <header className="relative z-10 flex min-h-14 shrink-0 items-center gap-3 border-b-2 border-foreground bg-card px-3 shadow-pop md:px-4">
        <span className="font-heading text-xl font-extrabold tracking-tight text-foreground">
          devlife
        </span>
        <Tabs
          value={stage}
          onValueChange={(v) => setStage(v as StageId)}
          className="min-w-0 flex-1"
        >
          <TabsList className="h-12 w-full max-w-xl md:h-10">
            {STAGES.map((s) => (
              <TabsTrigger key={s} value={s} className="gap-1.5">
                <IconBadge tone={stageIconTone[s]} className="h-7 w-7">
                  {stageIcons[s]}
                </IconBadge>
                <span className="hidden sm:inline">{STAGE_LABELS[s]}</span>
                <span className="sm:hidden">{STAGE_LABELS[s][0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex shrink-0 items-center gap-2">
          <label className="hidden min-h-12 items-center gap-2 sm:flex">
            <Label>Nhân vật</Label>
            <Switch
              checked={showCharacter}
              onCheckedChange={setShowCharacter}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            showArrow={false}
            onClick={resetStage}
          >
            Đặt lại phòng
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <DecorativeShapes />

        <aside
          className="relative z-10 order-2 flex min-h-0 flex-col border-t-2 border-foreground bg-card/95 p-4 backdrop-blur-sm lg:order-1 lg:flex-1 lg:border-r lg:border-t-0"
        >
          <NotificationsPanel />
        </aside>

        <main
          className="relative z-20 order-1 flex shrink-0 flex-col items-center justify-center bg-[var(--game-letterbox)] p-2 lg:order-2"
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
          <p className="mt-2 w-full truncate px-2 text-center text-xs font-medium text-muted-foreground">
            {t(room.title)}
            {debug ? " · debug bật (D)" : ""}
          </p>
        </main>

        <aside
          className="relative z-10 order-3 flex min-h-0 w-full flex-col border-t-2 border-foreground bg-card/95 lg:max-w-[400px] lg:flex-1 lg:border-l lg:border-t-0"
        >
          <div className="flex min-h-0 flex-1 flex-col p-4 pt-6 lg:max-h-[calc(100vh-3.5rem)]">
            <Tabs
              value={sidebarTab}
              onValueChange={(v) => {
                setSidebarTab(v as SidebarTab);
                if (v === "edit-room") setCustomizeOpen(true);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player">Thông tin nhân vật</TabsTrigger>
                <TabsTrigger value="edit-room">Sửa phòng</TabsTrigger>
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
