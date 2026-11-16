import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private keyPrefix: string | undefined;
  private isConnected = false;
  private readonly memoryStore = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>("redis.host") ?? "localhost";
    const port = this.configService.get<number>("redis.port") ?? 6379;
    const password = this.configService.get<string>("redis.password");
    const db = this.configService.get<number>("redis.db") ?? 0;
    this.keyPrefix = this.configService.get<string>("redis.keyPrefix") || undefined;
    this.client = new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 5) {
          return null;
        }
        return Math.min(times * 1000, 5000);
      },
      ...(this.keyPrefix ? { keyPrefix: this.keyPrefix } : {}),
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.logger.log("Connected to Redis successfully");
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
      this.logger.warn(`Redis unavailable (${err.message}). Using in-memory fallback for local development.`);
    });

    this.client.on("close", () => {
      this.isConnected = false;
    });

    if (this.keyPrefix) {
      this.logger.log(`Redis key prefix enabled: ${this.keyPrefix}`);
    }
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
    this.client = null;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis client not initialized");
    }
    return this.client;
  }

  /** Configured prefix (e.g. `supercampus:`) — ioredis applies it to all commands automatically. */
  getKeyPrefix(): string | undefined {
    return this.keyPrefix;
  }

  async get<T = string>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      } catch (err: any) {
        this.logger.warn(`Redis get failed (${err?.message}), falling back to memory store`);
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  async set(key: string, value: string | object, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set failed (${err?.message}), falling back to memory store`);
      }
    }

    this.memoryStore.set(key, {
      value: serialized,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis del failed (${err?.message})`);
      }
    }
    this.memoryStore.delete(key);
  }
}
