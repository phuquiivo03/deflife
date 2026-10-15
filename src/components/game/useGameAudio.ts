"use client";

import { useEffect } from "react";
import { gameBus } from "@/game/events/bus";
import type { GameEvent } from "@/game/events/types";
import { SIM_CATALOG } from "@/game/career/content";
import { cueForHit, cueKeysForGameEvent, planTimeAudio, type PointerHit } from "@/game/audio/cues";
import { createAudioEngine } from "@/game/audio/engine";
import { preferredAudioFormat } from "@/game/audio/sprite";
import { createBrowserAudioContext } from "@/game/audio/webaudio";
import { attachAudioEngine } from "@/game/audio/client";
import { getAudioSettings, subscribeAudioSettings } from "@/game/audio/settings";
import { useGameStore } from "@/game/state/store";
import { snapshot, timeBus } from "@/game/time";
import type { TimeEvent } from "@/game/time/types";

const HOVER_GAP_MS = 160;

function describePointerTarget(target: EventTarget | null): PointerHit | null {
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!element) return null;
  const control = element.closest("button, [role='tab']");
  if (!(control instanceof HTMLElement)) return null;
  return {
    sfx: control.getAttribute("data-sfx"),
    ariaDisabled: control.getAttribute("aria-disabled") === "true",
    role: control.getAttribute("role"),
    tag: control.tagName.toLowerCase(),
    disabled: control instanceof HTMLButtonElement ? control.disabled : false,
  };
}

function controlElement(target: EventTarget | null): Element | null {
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  return element?.closest("button, [role='tab']") ?? null;
}

export function useGameAudio(): void {
  useEffect(() => {
    let engine: ReturnType<typeof createAudioEngine>;
    try {
      const reduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const format = preferredAudioFormat((mime) => {
        try {
          return document.createElement("audio").canPlayType(mime);
        } catch {
          return "";
        }
      });
      engine = createAudioEngine({
        fadeMs: reduced ? 0 : 700,
        format,
        createContext: createBrowserAudioContext,
      });
    } catch {
      return;
    }

    attachAudioEngine(engine);
    try {
      engine.setSettings(getAudioSettings());
      engine.notePhase(snapshot(useGameStore.getState().totalMinutes).phaseId);
    } catch {
      /* ignore */
    }

    void engine.preloadSfx();

    const offSettings = subscribeAudioSettings((levels) => {
      try {
        engine.setSettings(levels);
      } catch {
        /* ignore */
      }
    });

    let pending: TimeEvent[] = [];
    let queued = false;
    const queueTime = (event: TimeEvent) => {
      pending.push(event);
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        const batch = pending;
        pending = [];
        try {
          engine.applyTimePlan(planTimeAudio(batch));
        } catch {
          /* ignore */
        }
      });
    };

    const onGame = (event: GameEvent) => {
      try {
        for (const key of cueKeysForGameEvent(event, SIM_CATALOG.config.rank_brackets)) {
          engine.playKey(key);
        }
      } catch {
        /* ignore */
      }
    };

    const offs = [
      timeBus.on("phaseChanged", queueTime),
      timeBus.on("hourChanged", queueTime),
      timeBus.on("dayStarted", queueTime),
      timeBus.on("sleep", queueTime),
      gameBus.on("skillXpGained", onGame),
      gameBus.on("skillLevelUp", onGame),
      gameBus.on("studyCompleted", onGame),
      gameBus.on("jobAccepted", onGame),
      gameBus.on("jobCompleted", onGame),
      gameBus.on("milestoneReached", onGame),
      gameBus.on("moneyChanged", onGame),
      gameBus.on("energyChanged", onGame),
    ];

    let lastHover = 0;
    const gestureListener: AddEventListenerOptions = { capture: true, passive: true };
    const onUnlock = () => {
      try {
        engine.unlock();
      } catch {
        /* ignore */
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const at = performance.now();
      try {
        engine.unlock();
        const cue = cueForHit(describePointerTarget(event.target), "down");
        if (cue) engine.playKey(cue, at);
      } catch {
        /* ignore */
      }
    };
    const onPointerOver = (event: PointerEvent) => {
      try {
        if (event.pointerType !== "mouse") return;
        const next = controlElement(event.target);
        if (!next) return;
        if (event.relatedTarget instanceof Node && next.contains(event.relatedTarget)) return;
        const at = performance.now();
        if (at - lastHover < HOVER_GAP_MS) return;
        lastHover = at;
        const cue = cueForHit(describePointerTarget(event.target), "over");
        if (cue) engine.playKey(cue);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("touchstart", onUnlock, gestureListener);
    window.addEventListener("pointerdown", onPointerDown, gestureListener);
    window.addEventListener("pointerover", onPointerOver, true);
    window.addEventListener("keydown", onUnlock, gestureListener);

    return () => {
      offSettings();
      for (const off of offs) off();
      window.removeEventListener("touchstart", onUnlock, gestureListener);
      window.removeEventListener("pointerdown", onPointerDown, gestureListener);
      window.removeEventListener("pointerover", onPointerOver, true);
      window.removeEventListener("keydown", onUnlock, gestureListener);
      attachAudioEngine(null);
      engine.dispose();
    };
  }, []);
}
