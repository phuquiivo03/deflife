"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Backpack, Coffee, Monitor } from "lucide-react";
import { STAGES, type StageId } from "@/game/config";
import { getRoom } from "@/game/content";
import { useGameStore } from "@/game/state/store";
import { SceneCanvas } from "./SceneCanvas";
import { CustomizePanel } from "./CustomizePanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const stageIcons: Record<StageId, React.ReactNode> = {
  student: <Backpack className="h-4 w-4" />,
  junior: <Monitor className="h-4 w-4" />,
  senior: <Coffee className="h-4 w-4" />,
};

export function GameShell() {
  const areaRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [mobilePortrait, setMobilePortrait] = useState(false);
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
    const onResize = () => {
      setWide(window.innerWidth >= 1280);
      setMobilePortrait(
        window.innerWidth < 768 && window.innerHeight > window.innerWidth,
      );
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setStage("student");
      if (e.key === "2") setStage("junior");
      if (e.key === "3") setStage("senior");
      if (e.key === "Escape") selectSlot(null);
      if (e.key === "c" || e.key === "C") setCustomizeOpen(!customizeOpen);
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
    customizeOpen,
    setCustomizeOpen,
    selectedSlot,
    cycleVariant,
    debug,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (wide) setCustomizeOpen(true);
  }, [wide, setCustomizeOpen]);

  const room = getRoom(stage);
  const docked = wide && customizeOpen;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15111c] text-zinc-200">
        Loading your room…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3 md:px-4">
        <span className="font-[family-name:var(--font-pixel)] text-lg tracking-tight">
          devlife
        </span>
        <Tabs
          value={stage}
          onValueChange={(v) => setStage(v as StageId)}
          className="flex-1"
        >
          <TabsList className="h-9">
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
        <div className="hidden items-center gap-2 md:flex">
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            Character
            <Switch
              checked={showCharacter}
              onCheckedChange={setShowCharacter}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={resetStage}>
            Reset room
          </Button>
          {!docked && (
            <Button
              type="button"
              size="sm"
              onClick={() => setCustomizeOpen(true)}
            >
              Customize
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main
          className={`relative flex flex-1 flex-col items-center justify-center bg-[#15111c] p-2 ${
            mobilePortrait ? "max-h-[62vh]" : "min-h-[280px]"
          }`}
        >
          <div
            ref={areaRef}
            className="flex h-full w-full max-w-full items-center justify-center"
          >
            <SceneCanvas areaRef={areaRef} debug={debug} />
          </div>
          <p className="pointer-events-none absolute bottom-2 text-xs text-zinc-500">
            {room.title}
            {debug ? " · debug on (D)" : ""}
          </p>
        </main>

        {docked && (
          <aside className="hidden w-[360px] shrink-0 border-l border-zinc-200 bg-white p-4 xl:block">
            <CustomizePanel />
          </aside>
        )}
      </div>

      {mobilePortrait && (
        <section className="max-h-[38vh] shrink-0 border-t border-zinc-200 bg-white p-3">
          <CustomizePanel />
        </section>
      )}

      <Sheet
        open={customizeOpen && !docked && !mobilePortrait}
        onOpenChange={setCustomizeOpen}
      >
        <SheetContent side="right" className="overflow-y-auto">
          <CustomizePanel />
        </SheetContent>
      </Sheet>
    </div>
  );
}
