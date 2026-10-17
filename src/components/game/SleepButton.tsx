"use client";

import { PixelButton } from "@/components/ui/button";
import { m51AssetPath } from "@/game/life/assets";
import {
  SLEEP_LABEL,
  sleepButtonMetrics,
  sleepIconFile,
  sleepZzzStyle,
} from "./sleep-button.config";
import styles from "./sleep-button.module.css";

/**
 * Icon-only sleep control. The words "Đi ngủ" are the tooltip
 * (`title` + `aria-label`); the shared tooltip component is not on main.
 * The wrapper keeps that title when the button is disabled.
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
    <span className="ml-auto inline-flex" title={SLEEP_LABEL}>
      <PixelButton
        variant="icon"
        disabled={!canSleep}
        aria-label={SLEEP_LABEL}
        title={SLEEP_LABEL}
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
  );
}
