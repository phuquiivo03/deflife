"use client";

import { useEffect, useMemo, useState } from "react";
import { getCatalog, getRoom } from "@/game/content";
import { loadAtlas, type LoadedAtlas } from "@/game/render/atlas";
import { useGameStore } from "@/game/state/store";
import { ItemThumb } from "./ItemThumb";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900">Customize</h2>
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          {slots.map((slot) => {
            const current = loadout[slot.id] ?? slot.default;
            const variants = items.filter((i) =>
              slot.accepts.includes(i.category),
            );
            const enabled = current !== null;
            return (
              <div
                key={slot.id}
                id={`slot-${slot.id}`}
                className={
                  selectedSlot === slot.id
                    ? "rounded-lg border border-amber-300 bg-amber-50/50 p-2"
                    : "rounded-lg border border-transparent p-2"
                }
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-sm font-medium"
                    onClick={() => selectSlot(slot.id)}
                  >
                    {slot.label?.en}
                    <span className="block text-xs font-normal text-zinc-500">
                      {slot.label?.vi}
                    </span>
                  </button>
                  {!slot.required && (
                    <Switch
                      checked={enabled}
                      onCheckedChange={(on) =>
                        setSlotItem(slot.id, on ? slot.default : null)
                      }
                      aria-label={`Toggle ${slot.label?.en}`}
                    />
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {!slot.required && (
                    <ItemThumb
                      atlas={atlas}
                      label="None"
                      selected={!enabled}
                      onClick={() => setSlotItem(slot.id, null)}
                    />
                  )}
                  {variants.map((v) => (
                    <ItemThumb
                      key={v.id}
                      atlas={atlas}
                      sprite={v.sprite}
                      label={v.name.en}
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
    </div>
  );
}
