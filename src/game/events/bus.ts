import type { GameEvent, GameEventOf, GameEventType } from "./types";

type Handler = (event: GameEvent) => void;

export type GameBus = {
  on<T extends GameEventType>(
    type: T,
    handler: (event: GameEventOf<T>) => void,
  ): () => void;
  emit(event: GameEvent): void;
  clear(): void;
};

export function createGameBus(): GameBus {
  const listeners = new Map<GameEventType, Set<Handler>>();

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

/**
 * Domain events (skills, jobs, money, energy).
 * Clock signals stay on `timeBus`. Subscribers must not move the clock.
 */
export const gameBus = createGameBus();
