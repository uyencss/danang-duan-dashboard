import Redis from "ioredis";
import { logger } from "./logger";

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn({ msg: "REDIS_URL not set — caching disabled, falling back to direct DB queries" });
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("connect", () => {
      logger.info({ msg: "Redis connected" });
    });

    client.on("error", (err) => {
      logger.warn({ msg: "Redis error", err: err.message });
    });

    // Attempt connection (non-blocking)
    client.connect().catch(() => {
      logger.warn({ msg: "Redis initial connection failed — will retry on next operation" });
    });

    return client;
  } catch {
    logger.warn({ msg: "Failed to create Redis client" });
    return null;
  }
}

declare global {
  var redis: Redis | null | undefined;
}

if (process.env.NODE_ENV !== "production") {
  delete (globalThis as any).redis;
}

const redis = globalThis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.redis = redis;
}

export default redis;
