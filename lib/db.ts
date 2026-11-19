import { Redis } from "@upstash/redis";

// Thin key-value layer over Upstash Redis. In local development without Redis
// credentials it falls back to an in-memory map so the app can run offline.

type Store = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  incrby(key: string, by: number): Promise<void>;
  keys(prefix: string): Promise<string[]>;
};

function redisStore(): Store | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token });
  return {
    get: async <T,>(k: string) => (await r.get<T>(k)) ?? null,
    set: async (k, v) => { await r.set(k, v); },
    del: async (k) => { await r.del(k); },
    incrby: async (k, by) => { await r.incrby(k, Math.round(by)); },
    keys: async (prefix) => {
      const out: string[] = [];
      let cursor: string | number = 0;
      do {
        const [next, batch]: [string | number, string[]] = await r.scan(cursor, { match: `${prefix}*`, count: 200 });
        out.push(...batch);
        cursor = next;
      } while (String(cursor) !== "0");
      return out;
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __memdb?: Map<string, string> };
  const m = (g.__memdb ??= new Map());
  return {
    get: async <T,>(k: string) => (m.has(k) ? (JSON.parse(m.get(k)!) as T) : null),
    set: async (k, v) => { m.set(k, JSON.stringify(v)); },
    del: async (k) => { m.delete(k); },
    incrby: async (k, by) => { m.set(k, JSON.stringify((m.has(k) ? JSON.parse(m.get(k)!) : 0) + Math.round(by))); },
    keys: async (prefix) => [...m.keys()].filter((k) => k.startsWith(prefix)),
  };
}

let store: Store | undefined;
export function db(): Store {
  if (store) return store;
  const r = redisStore();
  if (!r && process.env.NODE_ENV === "production") {
    throw new Error("Upstash Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).");
  }
  store = r ?? memoryStore();
  return store;
}
