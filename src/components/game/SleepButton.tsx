"use client";

import { PixelButton } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { m51AssetPath } from "@/game/life/assets";
import {
  SLEEP_LABEL,
  sleepButtonMetrics,
  sleepIconFile,
  sleepZzzStyle,
} from "./sleep-button.config";
import styles from "./sleep-button.module.css";

/**
 * Icon-only sleep control. The words "Đi ngủ" are the shared tooltip.
 * The button keeps that name as its `aria-label`. The wrapper is the
 * trigger so the tip still opens when the control is disabled.
 */
export function SleepButton({
  canSleep,
  onSleep,
}: {
  canSleep: boolean;
  onSleep: () => void;
}) {
  const metrics = sleepButtonMetrics();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <PixelButton
            variant="icon"
            disabled={!canSleep}
            aria-label={SLEEP_LABEL}
            className={styles.button}
            style={{
              width: metrics.buttonPx,
              height: metrics.buttonPx,
              minWidth: metrics.buttonPx,
              minHeight: metrics.buttonPx,
            }}
            onClick={onSleep}
            data-testid="sleep-button"
            data-sleep-ready={canSleep ? "1" : "0"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel bed stays unoptimized */}
            <img
              src={m51AssetPath(sleepIconFile())}
              alt=""
              width={metrics.iconPx}
              height={metrics.iconPx}
              draggable={false}
              data-icon-key="icon_btn_sleep"
              className={styles.icon}
              style={{ width: metrics.iconPx, height: metrics.iconPx }}
            />
            {canSleep ? (
              <span
                className={styles.zzz}
                aria-hidden="true"
                data-testid="sleep-zzz"
                style={sleepZzzStyle()}
              />
            ) : null}
          </PixelButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" data-testid="sleep-tooltip">
        {SLEEP_LABEL}
      </TooltipContent>
    </Tooltip>
  );
}
