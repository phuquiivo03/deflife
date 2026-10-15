import type { PhaseId } from "./config";

/** Derived view of the clock. `day` is 1-based. */
export type ClockSnapshot = {
  totalMinutes: number;
  day: number;
  hour: number;
  minute: number;
  /** 0–1439, floored. */
  minuteOfDay: number;
  phaseId: PhaseId;
  /** `HH:MM` in 24-hour form. */
  clockLabel: string;
};

/**
 * Events are emitted in this order when several boundaries coincide:
 * `minute`, `hourChanged`, `phaseChanged`, `dayStarted`.
 * `sleep` is emitted after the destination boundaries of a sleep skip.
 */
export type TimeEvent =
  | {
      type: "minute";
      /** Integer minute just entered, or the end of a coalesced hour segment. */
      totalMinutes: number;
      day: number;
      hour: number;
      minute: number;
      /**
       * How many in-game minutes this event represents.
       * `1` on the normal path. Larger when a catch-up tick coalesces an hour.
       */
      count: number;
    }
  | {
      type: "hourChanged";
      day: number;
      hour: number;
      totalMinutes: number;
    }
  | {
      type: "phaseChanged";
      phase: PhaseId;
      previous: PhaseId;
      day: number;
      totalMinutes: number;
    }
  | {
      type: "dayStarted";
      day: number;
      totalMinutes: number;
    }
  | {
      type: "sleep";
      fromTotalMinutes: number;
      toTotalMinutes: number;
      day: number;
    };

export type TimeEventType = TimeEvent["type"];

export type TimeEventOf<T extends TimeEventType> = Extract<TimeEvent, { type: T }>;
