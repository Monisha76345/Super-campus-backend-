import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private keyPrefix: string | undefined;

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
      ...(this.keyPrefix ? { keyPrefix: this.keyPrefix } : {}),
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
    const value = await this.getClient().get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: string | object, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.getClient().setex(key, ttlSeconds, serialized);
    } else {
      await this.getClient().set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }
}
