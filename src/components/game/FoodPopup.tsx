"use client";

import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { LIFE } from "@/game/life/content";
import { mealBlocked } from "@/game/life/logic";
import { foodPrice } from "@/game/life/traits";
import { useGameStore } from "@/game/state/store";
import { formatVnd } from "@/lib/format-currency";

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
              <Button
                key={food.id}
                type="button"
                size="sm"
                showArrow={false}
                variant="outline"
                disabled={reason != null}
                aria-disabled={reason != null}
                title={reason ?? food.label}
                className="min-h-11"
                data-testid={`food-${food.id}`}
                onClick={() => eat(food.id)}
              >
                {food.label} · {formatVnd(price)}
                {food.health < 0 ? " · sức khỏe giảm" : ""}
              </Button>
            );
          })}
        </div>
        <Button type="button" variant="ghost" className="mt-3 min-h-11 w-full" data-testid="food-close" onClick={onClose}>
          Đóng
        </Button>
      </PanelCard>
    </div>
  );
}
