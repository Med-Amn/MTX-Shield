import crypto from "crypto";

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return Redis.fromEnv();
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = await getRedis();
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    const count = await redis.incr(windowKey);
    if (count === 1) await redis.expire(windowKey, Math.ceil(windowMs / 1000));
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