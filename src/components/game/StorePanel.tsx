"use client";

/* eslint-disable @next/next/no-img-element -- native pixel art stays unoptimized */

import { m5AssetPath, type M5AssetKey } from "@/game/life/assets";
import { buyBlock, shopOf, STORE, STORE_ITEMS, storePrice } from "@/game/life/furniture";
import { useGameStore } from "@/game/state/store";
import { snapshot } from "@/game/time";
import { formatVnd } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";

function iconSize(icon: string): { w: number; h: number } {
  return icon.startsWith("icon_store_room_") ? { w: 128, h: 80 } : { w: 64, h: 64 };
}

export function StorePanel() {
  const career = useGameStore((s) => s.career);
  const day = useGameStore((s) => snapshot(s.totalMinutes).day);
  const buy = useGameStore((s) => s.buyStoreItem);
  const pin = useGameStore((s) => s.pinStoreItem);
  const shop = shopOf(career);
  const sale = STORE.black_friday_discount;

  return (
    <div className="store-frame min-h-0 flex-1 overflow-y-auto p-3" data-testid="store-panel" data-sale={sale}>
      <ul className="flex flex-col items-center gap-3">
        {STORE_ITEMS.map((item) => {
          const price = storePrice(item, day);
          const owned = shop.owned.includes(item.id);
          const reason = owned ? null : buyBlock(career, item.id);
          const pinned = shop.pin === item.id;
          const icon = iconSize(item.icon);
          return (
            <li key={item.id} className="w-[192px]" data-testid={`store-item-${item.id}`} data-owned={owned ? "1" : "0"} data-price={price}>
              <div className="relative h-[240px] w-[192px]">
                <img src={m5AssetPath("ui_store_card.png")} width={192} height={240} alt="" className="pixel-img" />
                <img
                  src={m5AssetPath(item.icon as M5AssetKey)}
                  width={icon.w}
                  height={icon.h}
                  alt=""
                  className="pixel-img absolute"
                  style={{ left: (192 - icon.w) / 2, top: icon.h > 64 ? 28 : 48 }}
                />
                <p className="absolute inset-x-2 bottom-8 text-center font-galmuri-7 text-galmuri-small text-[var(--foreground)]">
                  {item.label}
                </p>
                <p className="absolute inset-x-2 bottom-2 text-center font-galmuri-9 text-galmuri-body text-[var(--foreground)]">
                  {formatVnd(price)}
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  showArrow={false}
                  className="min-h-11 flex-1"
                  disabled={owned || reason != null}
                  data-testid={`store-buy-${item.id}`}
                  onClick={() => buy(item.id)}
                >
                  {owned ? "Đã có" : "Mua"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  showArrow={false}
                  className="min-h-11 flex-1"
                  data-testid={`store-pin-${item.id}`}
                  data-pinned={pinned ? "1" : "0"}
                  onClick={() => pin(pinned ? null : item.id)}
                >
                  {pinned ? "Đang ghim" : "Ghim"}
                </Button>
              </div>
              {reason ? (
                <p className="mt-1 text-center font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">{reason}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
