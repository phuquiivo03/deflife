"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { useState } from "react";
import { PixelButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LIFE } from "@/game/life/content";
import { m51AssetPath } from "@/game/life/assets";
import {
  actionEatArtFile,
  foodArtFile,
  foodDockMetrics,
  foodDockStyle,
  hungerArtFile,
} from "@/game/life/m51-art";
import { hungerLabel, hungerLevel } from "@/game/life/hunger";
import { lifeOf, mealBlocked } from "@/game/life/logic";
import { foodPrice } from "@/game/life/traits";
import { useGameStore } from "@/game/state/store";
import { formatVnd } from "@/lib/format-currency";

export function HungerDock() {
  const career = useGameStore((s) => s.career);
  const [open, setOpen] = useState(false);
  const slots = lifeOf(career).slotsSinceMeal;
  const hunger = hungerLevel(slots);
  const dock = foodDockMetrics();

  return (
    <>
      <div
        className="mt-3 flex items-center justify-center gap-3 pt-2"
        data-testid="hunger"
        data-hunger={hunger}
        data-slots={slots}
      >
        <div className="food-anchor relative" style={foodDockStyle()}>
          <button type="button" className="food-bowl" aria-label="Ăn uống" data-testid="food-open" onClick={() => setOpen(true)}>
            <img
              src={m51AssetPath(foodArtFile())}
              width={dock.foodPx}
              height={dock.foodPx}
              alt=""
              className="pixel-img"
            />
          </button>
          <img
            src={m51AssetPath(hungerArtFile(hunger))}
            width={dock.hungerPx}
            height={dock.hungerPx}
            alt=""
            className={hunger === "hungry" ? "hunger-badge pixel-img hunger-blink" : "hunger-badge pixel-img"}
            data-testid="hunger-icon"
          />
        </div>
        <span className="font-galmuri-7 text-galmuri-small text-[var(--foreground)]" data-testid="hunger-label">
          {hungerLabel(hunger)}
        </span>
      </div>
      <FoodPopup open={open} onOpenChange={setOpen} />
    </>
  );
}

export function FoodPopup({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const career = useGameStore((s) => s.career);
  const eat = useGameStore((s) => s.eat);
  const dock = foodDockMetrics();

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Ăn uống" testId="food-popup" closeLabel="Đóng">
      <img
        src={m51AssetPath(actionEatArtFile())}
        width={dock.actionPx}
        height={dock.actionPx}
        alt=""
        className="pixel-img"
        data-testid="food-eat-icon"
      />
      <div className="mt-3 flex flex-col gap-2">
        {LIFE.foods.map((food) => {
          const reason = mealBlocked(career, food.id);
          const price = foodPrice(food.price, career);
          return (
            <PixelButton
              key={food.id}
              variant="secondary"
              disabled={reason != null}
              aria-disabled={reason != null}
              title={reason ?? food.label}
              className="w-full"
              data-testid={`food-${food.id}`}
              onClick={() => eat(food.id)}
            >
              {food.label} · {formatVnd(price)}
              {food.health < 0 ? " · sức khỏe giảm" : ""}
            </PixelButton>
          );
        })}
      </div>
    </Modal>
  );
}
