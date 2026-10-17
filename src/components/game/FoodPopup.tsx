"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { useState } from "react";
import { PixelButton } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { LIFE } from "@/game/life/content";
import { m51AssetPath } from "@/game/life/assets";
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

  return (
    <>
      <div className="mt-3 flex items-center justify-center gap-3">
        <PixelButton
          variant="icon"
          aria-label="Ăn uống"
          data-testid="food-open"
          onClick={() => setOpen(true)}
        >
          <img
            src={m51AssetPath("icon_btn_food_x2.png")}
            width={32}
            height={32}
            alt=""
            className="pixel-img h-8 w-8"
          />
        </PixelButton>
        <span className="flex items-center gap-2" data-testid="hunger" data-hunger={hunger} data-slots={slots}>
          <img
            src={m51AssetPath(`icon_hunger_${hunger}_x2.png`)}
            width={32}
            height={32}
            alt=""
            className={hunger === "hungry" ? "pixel-img hunger-blink h-8 w-8" : "pixel-img h-8 w-8"}
            data-testid="hunger-icon"
          />
          <span className="font-galmuri-7 text-galmuri-small text-[var(--foreground)]" data-testid="hunger-label">
            {hungerLabel(hunger)}
          </span>
        </span>
      </div>
      {open ? <FoodPopup onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function FoodPopup({ onClose }: { onClose: () => void }) {
  const career = useGameStore((s) => s.career);
  const eat = useGameStore((s) => s.eat);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(42,37,72,0.45)] p-4" data-testid="food-popup">
      <PanelCard className="w-full max-w-sm p-4">
        <p className="font-galmuri-9 text-galmuri-body text-[var(--foreground)]">Ăn uống</p>
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
        <PixelButton variant="secondary" className="mt-3 w-full" data-testid="food-close" onClick={onClose}>
          Đóng
        </PixelButton>
      </PanelCard>
    </div>
  );
}
