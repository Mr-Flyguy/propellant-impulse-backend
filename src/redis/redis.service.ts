import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface SessionData {
  userId: number;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly memoryStore = new Map<string, { value: string; expiresAt: number }>();
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
    });

    this.client
      .connect()
      .then(() => {
        this.isConnected = true;
        this.logger.log(`Подключение к Redis успешно (${host}:${port})`);
      })
      .catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Redis (${host}:${port}) недоступен: ${err.message}. Используется fallback хранилище.`);
      });

    this.client.on('error', (err) => {
      this.isConnected = false;
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });
  }

  async setSession(sessionId: string, data: SessionData, ttlSeconds: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    const serialized = JSON.stringify(data);
    if (this.isConnected) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (e) {
        this.logger.warn(`Ошибка записи в Redis, сохранение в fallback: ${e.message}`);
      }
    }
    this.memoryStore.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    if (this.isConnected) {
      try {
        const res = await this.client.get(key);
        if (res) return JSON.parse(res);
        return null;
      } catch (e) {
        this.logger.warn(`Ошибка чтения из Redis, проверка fallback: ${e.message}`);
      }
    }
    const mem = this.memoryStore.get(key);
    if (mem) {
      if (Date.now() > mem.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return JSON.parse(mem.value);
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    if (this.isConnected) {
      try {
        await this.client.del(key);
      } catch (e) {
        // ignore
      }
    }
    this.memoryStore.delete(key);
  }

  async getKeys(pattern: string = 'session:*'): Promise<string[]> {
    if (this.isConnected) {
      try {
        return await this.client.keys(pattern);
      } catch (e) {
        // fallback
      }
    }
    return Array.from(this.memoryStore.keys());
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.client.quit();
    }
  }
}
