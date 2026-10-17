"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { PixelButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIFE } from "@/game/life/content";
import { m51AssetPath } from "@/game/life/assets";
import { actionEatArtFile, foodArtFile, foodDockMetrics, foodDockStyle } from "@/game/life/m51-art";
import { hungerLabel, hungerLevel } from "@/game/life/hunger";
import { lifeOf, mealBlocked } from "@/game/life/logic";
import { foodPrice } from "@/game/life/traits";
import { useGameStore } from "@/game/state/store";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format-currency";
import { foodHungerTip, hungerBowlBlinkStyle } from "./food-dock.config";
import styles from "./food-dock.module.css";

export function HungerDock() {
  const slots = useGameStore((s) => lifeOf(s.career).slotsSinceMeal);
  const open = useGameStore((s) => s.foodOpen);
  const setOpen = useGameStore((s) => s.setFoodOpen);
  const hunger = hungerLevel(slots);
  const dock = foodDockMetrics();
  const tip = foodHungerTip(hunger);
  const blinking = hunger !== "full";

  return (
    <>
      <div
        className="mt-3 flex items-center justify-center gap-3 pt-2"
        data-testid="hunger"
        data-hunger={hunger}
        data-slots={slots}
      >
        <div className="food-anchor relative" style={foodDockStyle()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button
                  type="button"
                  className="food-bowl"
                  aria-label={tip}
                  data-testid="food-open"
                  onClick={() => setOpen(true)}
                >
                  <img
                    src={m51AssetPath(foodArtFile())}
                    width={dock.foodPx}
                    height={dock.foodPx}
                    alt=""
                    draggable={false}
                    data-testid="food-bowl-icon"
                    data-hunger-blink={hunger}
                    className={cn("pixel-img", blinking && styles.bowlBlink)}
                    style={hungerBowlBlinkStyle(hunger)}
                  />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" data-testid="food-tooltip">
              {tip}
            </TooltipContent>
          </Tooltip>
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
