/**
 * Rate limiting con ventana deslizante.
 *
 * En producción (Vercel serverless) cada invocación puede ser un proceso
 * distinto, por lo que un limitador en memoria no funciona de forma fiable.
 * Por eso:
 *
 *  - Si hay credenciales de Upstash Redis (`UPSTASH_REDIS_REST_URL` y
 *    `UPSTASH_REDIS_REST_TOKEN`), se usa Redis (atómico y compartido).
 *  - Si no, se degrada a un limitador en memoria (válido para dev / single
 *    instance / tests).
 *
 * Configuración por entorno:
 *  - RATE_LIMIT_MAX         peticiones permitidas por ventana (def. 10)
 *  - RATE_LIMIT_WINDOW_MS   tamaño de la ventana en ms (def. 60000)
 *  - RATE_LIMIT_DISABLED    si es "true", desactiva el límite (útil en E2E)
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  /** Backend efectivamente usado (útil para debug y observabilidad). */
  backend: 'redis' | 'memory' | 'disabled';
}

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const WINDOW_MS = readInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
const MAX_REQUESTS = readInt(process.env.RATE_LIMIT_MAX, 10);
const DISABLED = process.env.RATE_LIMIT_DISABLED === 'true';

// ---------------------------------------------------------------------------
// Backend en memoria
// ---------------------------------------------------------------------------

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number, windowMs: number): void {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

function checkMemory(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  prune(bucket, now, windowMs);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0] ?? now;
    buckets.set(key, bucket);
    return { success: false, remaining: 0, reset: oldest + windowMs, backend: 'memory' };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    success: true,
    remaining: Math.max(0, max - bucket.timestamps.length),
    reset: now + windowMs,
    backend: 'memory',
  };
}

// ---------------------------------------------------------------------------
// Backend Upstash Redis
// ---------------------------------------------------------------------------

interface RedisLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
}

let redisClient: RedisLike | null = null;
let redisInitialized = false;

async function getRedis(): Promise<RedisLike | null> {
  if (redisInitialized) return redisClient;
  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token }) as unknown as RedisLike;
    return redisClient;
  } catch {
    redisClient = null;
    return null;
  }
}

async function checkRedis(
  redis: RedisLike,
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));
  }

  const ttl = await redis.ttl(redisKey);
  const reset = Date.now() + Math.max(ttl, 0) * 1000;

  if (count > max) {
    return { success: false, remaining: 0, reset, backend: 'redis' };
  }
  return { success: true, remaining: Math.max(0, max - count), reset, backend: 'redis' };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Comprueba el rate limit para una clave (normalmente la IP).
 * Usa Redis si está configurado; si falla, cae a memoria sin romper la app.
 */
export async function checkRateLimit(
  ip: string,
  max: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS,
): Promise<RateLimitResult> {
  if (DISABLED) {
    return { success: true, remaining: Number.MAX_SAFE_INTEGER, reset: Date.now(), backend: 'disabled' };
  }

  const key = ip || 'unknown';
  const redis = await getRedis();

  if (redis) {
    try {
      return await checkRedis(redis, key, max, windowMs);
    } catch (error) {
      console.error('Upstash falló, usando memoria como fallback:', error);
    }
  }

  return checkMemory(key, max, windowMs);
}

/** Extrae la IP del cliente a partir de las cabeceras habituales. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return headers.get('x-real-ip') ?? 'unknown';
}
