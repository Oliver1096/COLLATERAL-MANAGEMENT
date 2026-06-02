const DEFAULT_TTL_MS = 1000 * 60 * 15;

interface CacheRecord<T> {
  timestamp: number;
  data: T;
}

const memoryCache = new Map<string, CacheRecord<unknown>>();

const readLocalCache = <T>(key: string): CacheRecord<T> | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as CacheRecord<T>) : null;
  } catch {
    return null;
  }
};

const writeLocalCache = <T>(key: string, value: CacheRecord<T>) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quotas or privacy settings should not block fresh API data.
  }
};

export const cachedJson = async <T>(
  cacheKey: string,
  url: string,
  ttlMs = DEFAULT_TTL_MS,
  shouldCache: (data: T) => boolean = () => true,
): Promise<T> => {
  const now = Date.now();
  const localKey = `nsc-insights:${cacheKey}`;
  const memoryHit = memoryCache.get(localKey) as CacheRecord<T> | undefined;

  if (memoryHit && now - memoryHit.timestamp < ttlMs) {
    if (shouldCache(memoryHit.data)) return memoryHit.data;
    memoryCache.delete(localKey);
  }

  const localHit = readLocalCache<T>(localKey);
  if (localHit && now - localHit.timestamp < ttlMs) {
    if (shouldCache(localHit.data)) {
      memoryCache.set(localKey, localHit);
      return localHit.data;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(localKey);
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T;

  if (shouldCache(data)) {
    const record = { timestamp: now, data };
    memoryCache.set(localKey, record);
    writeLocalCache(localKey, record);
  }

  return data;
};

export const buildQuery = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) acc[key] = String(value);
      return acc;
    }, {}),
  ).toString();
