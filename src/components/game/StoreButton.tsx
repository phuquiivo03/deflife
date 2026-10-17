"use client";

import { PixelButton } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { m51AssetPath } from "@/game/life/assets";
import { STORE_LABEL, storeButtonMetrics, storeIconFile } from "./store-button.config";

/**
 * Icon-only shop control. The words "Cửa hàng" are the shared tooltip.
 * The button keeps that name as its `aria-label`.
 */
export function StoreButton({ onOpen }: { onOpen: () => void }) {
  const metrics = storeButtonMetrics();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <PixelButton
            variant="icon"
            aria-label={STORE_LABEL}
            className="shrink-0"
            style={{
              width: metrics.buttonPx,
              height: metrics.buttonPx,
              minWidth: metrics.buttonPx,
              minHeight: metrics.buttonPx,
            }}
            onClick={onOpen}
            data-testid="open-store"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel shop icon stays unoptimized */}
            <img
              src={m51AssetPath(storeIconFile())}
              alt=""
              width={metrics.iconPx}
              height={metrics.iconPx}
              draggable={false}
              data-icon-key="icon_btn_store"
              className="pixelated block"
              style={{ width: metrics.iconPx, height: metrics.iconPx }}
            />
          </PixelButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" data-testid="store-tooltip">
        {STORE_LABEL}
      </TooltipContent>
    </Tooltip>
  );
}
