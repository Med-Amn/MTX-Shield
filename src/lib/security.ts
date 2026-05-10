import crypto from "crypto";

async function redisFetch(command: string, ...args: string[]): Promise<Response> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis not configured");
  const path = `/${command}/${args.map(encodeURIComponent).join("/")}`;
  return fetch(`${url}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function redisIncr(key: string): Promise<number> {
  const res = await redisFetch("INCR", key);
  const data = await res.json() as { result: number };
  return data.result;
}

async function redisExpire(key: string, seconds: number): Promise<void> {
  await redisFetch("EXPIRE", key, String(seconds));
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    const count = await redisIncr(windowKey);
    if (count === 1) await redisExpire(windowKey, Math.ceil(windowMs / 1000));
    const remaining = Math.max(0, maxRequests - count);
    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
    return { allowed: count <= maxRequests, remaining, resetAt };
  } catch {
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

export function verifyHMAC(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function signHMAC(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}