import type { StateStorage } from "zustand/middleware";

/**
 * Persistence port. v1 is localStorage. A Supabase adapter can implement
 * the same load/save pair later.
 * `remove` exists so the Zustand binding can delete a key.
 */
export interface StorageAdapter {
  load(key: string): string | null;
  save(key: string, value: string): void;
  remove(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  load(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  save(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private mode and quota failures leave the in-memory store running.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Same as save: ignore storage that is unavailable.
    }
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly rows = new Map<string, string>();

  load(key: string): string | null {
    return this.rows.get(key) ?? null;
  }

  save(key: string, value: string): void {
    this.rows.set(key, value);
  }

  remove(key: string): void {
    this.rows.delete(key);
  }
}

export function toStateStorage(adapter: StorageAdapter): StateStorage {
  return {
    getItem: (name) => adapter.load(name),
    setItem: (name, value) => {
      adapter.save(name, value);
    },
    removeItem: (name) => {
      adapter.remove(name);
    },
  };
}
