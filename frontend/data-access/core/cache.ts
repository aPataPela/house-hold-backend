import type { CacheEntry, RepositoryCacheOptions } from "./types";

export class RepositoryCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly options: RepositoryCacheOptions = {}) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + (this.options.ttlMs ?? 30_000),
    });
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export function cacheKey(...parts: Array<string | number | boolean | null | undefined>): string {
  return parts.map((part) => String(part ?? "")).join(":");
}

