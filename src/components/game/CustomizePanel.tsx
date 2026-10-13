"use client";

import { useEffect, useMemo, useState } from "react";
import { getCatalog, getRoom } from "@/game/content";
import { loadAtlas, type LoadedAtlas } from "@/game/render/atlas";
import { useGameStore } from "@/game/state/store";
import { ItemThumb } from "./ItemThumb";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelCard } from "@/components/ui/panel-card";
import { t } from "@/lib/locale";

export function CustomizePanel() {
  const stage = useGameStore((s) => s.stage);
  const loadout = useGameStore((s) => s.loadouts[stage]);
  const selectedSlot = useGameStore((s) => s.selectedSlot);
  const setSlotItem = useGameStore((s) => s.setSlotItem);
  const selectSlot = useGameStore((s) => s.selectSlot);
  const [atlas, setAtlas] = useState<LoadedAtlas | null>(null);

  const room = useMemo(() => getRoom(stage), [stage]);
  const { items } = useMemo(() => getCatalog(), []);

  useEffect(() => {
    loadAtlas().then(setAtlas).catch(() => setAtlas(null));
  }, []);

  const slots = room.slots.filter((s) => s.label);

  return (
    <PanelCard className="flex h-full min-h-0 flex-col gap-2 p-3">
      <h2 className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
        Tùy chỉnh
      </h2>
      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="space-y-3">
          {slots.map((slot) => {
            const current = loadout[slot.id] ?? slot.default;
            const variants = items.filter((i) =>
              slot.accepts.includes(i.category),
            );
            const enabled = current !== null;
            const slotLabel = t(slot.label);
            return (
              <div
                key={slot.id}
                id={`slot-${slot.id}`}
                className={
                  selectedSlot === slot.id
                    ? "rounded-[var(--radius-panel)] border border-[var(--accent-violet)] bg-white/70 p-2 shadow-[var(--shadow-panel)]"
                    : "rounded-[var(--radius-panel)] border border-transparent p-2"
                }
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="min-h-10 text-left md:min-h-0"
                    onClick={() => selectSlot(slot.id)}
                  >
                    <span className="font-galmuri-11 text-galmuri-title text-[var(--foreground)]">
                      {slotLabel}
                    </span>
                  </button>
                  {!slot.required && (
                    <Switch
                      checked={enabled}
                      onCheckedChange={(on) =>
                        setSlotItem(slot.id, on ? slot.default : null)
                      }
                      aria-label={`Bật/tắt ${slotLabel}`}
                    />
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {!slot.required && (
                    <ItemThumb
                      atlas={atlas}
                      label="Không"
                      selected={!enabled}
                      onClick={() => setSlotItem(slot.id, null)}
                    />
                  )}
                  {variants.map((v) => (
                    <ItemThumb
                      key={v.id}
                      atlas={atlas}
                      sprite={v.sprite}
                      label={t(v.name)}
                      badge={v.stage[0]?.toUpperCase()}
                      selected={enabled && current === v.id}
                      onClick={() => setSlotItem(slot.id, v.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </PanelCard>
  );
}
