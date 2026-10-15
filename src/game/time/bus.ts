import type { TimeEvent, TimeEventOf, TimeEventType } from "./types";

type Handler = (event: TimeEvent) => void;

export type TimeBus = {
  on<T extends TimeEventType>(
    type: T,
    handler: (event: TimeEventOf<T>) => void,
  ): () => void;
  emit(event: TimeEvent): void;
  clear(): void;
};

export function createTimeBus(): TimeBus {
  const listeners = new Map<TimeEventType, Set<Handler>>();

  return {
    on(type, handler) {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      const wrapped = handler as Handler;
      set.add(wrapped);
      return () => {
        set.delete(wrapped);
      };
    },
    emit(event) {
      const set = listeners.get(event.type);
      if (!set || set.size === 0) return;
      for (const handler of [...set]) {
        handler(event);
      }
    },
    clear() {
      listeners.clear();
    },
  };
}

/** Process-wide bus. Future systems subscribe here and never touch the loop. */
export const timeBus = createTimeBus();
