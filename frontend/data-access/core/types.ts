export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RequestContext = {
  accessToken?: string;
  signal?: AbortSignal;
  forceRefresh?: boolean;
};

export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type RepositoryCacheOptions = {
  ttlMs?: number;
};

