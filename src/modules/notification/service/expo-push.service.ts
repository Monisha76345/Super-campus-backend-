import { Injectable, Logger } from "@nestjs/common";

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly endpoint = "https://exp.host/--/api/v2/push/send";

  async send(messages: ExpoPushMessage[]): Promise<void> {
    if (!messages.length) return;

    const chunks = this.chunk(messages, 100);
    for (const chunk of chunks) {
      try {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        });
        const raw = await res.text();
        if (!res.ok) {
          this.logger.warn(`Expo push HTTP ${res.status}: ${raw.slice(0, 300)}`);
        } else {
          this.logger.debug(`Expo push accepted ${chunk.length} message(s)`);
        }
      } catch (err: unknown) {
        this.logger.warn(`Expo push failed: ${(err as Error).message}`);
      }
    }
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      out.push(items.slice(i, i + size));
    }
    return out;
  }
}
