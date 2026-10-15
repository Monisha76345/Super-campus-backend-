import { registerAs } from "@nestjs/config";

/** Normalize to `prefix:` so keys stay readable in Redis CLI. */
function normalizeRedisKeyPrefix(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.endsWith(":") ? trimmed : `${trimmed}:`;
}

export default registerAs("redis", () => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  /** Prefix keys when this API shares a Redis instance with another app. */
  keyPrefix: normalizeRedisKeyPrefix(process.env.REDIS_KEY_PREFIX),
}));
