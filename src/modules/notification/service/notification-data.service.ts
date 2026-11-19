import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { DeviceToken } from "../entity/device-token.model";
import { AppNotification } from "../entity/notification.model";
import { NotificationPreference } from "../entity/notification-preference.model";
import { NotificationRepository } from "../repository/notification.repository";

@Injectable()
export class NotificationDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<NotificationRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new NotificationRepository(manager);
  }

  async saveNotifications(namespace: string, rows: AppNotification[]): Promise<AppNotification[]> {
    return (await this.repo(namespace)).saveNotifications(rows);
  }

  async findByUserId(
    namespace: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<AppNotification[]> {
    return (await this.repo(namespace)).findByUserId(userId, limit, offset);
  }

  async countUnread(namespace: string, userId: string): Promise<number> {
    return (await this.repo(namespace)).countUnread(userId);
  }

  async markRead(namespace: string, id: string, userId: string): Promise<AppNotification | null> {
    return (await this.repo(namespace)).markRead(id, userId);
  }

  async markAllRead(namespace: string, userId: string): Promise<number> {
    return (await this.repo(namespace)).markAllRead(userId);
  }

  async findDeviceTokenByToken(namespace: string, token: string): Promise<DeviceToken | null> {
    return (await this.repo(namespace)).findDeviceTokenByToken(token);
  }

  async findDeviceTokensByUserIds(namespace: string, userIds: string[]): Promise<DeviceToken[]> {
    return (await this.repo(namespace)).findDeviceTokensByUserIds(userIds);
  }

  async saveDeviceToken(namespace: string, row: DeviceToken): Promise<DeviceToken> {
    return (await this.repo(namespace)).saveDeviceToken(row);
  }

  async softDeleteDeviceToken(namespace: string, token: string, userId: string): Promise<void> {
    await (await this.repo(namespace)).softDeleteDeviceToken(token, userId);
  }

  async findPreferenceByUserId(namespace: string, userId: string): Promise<NotificationPreference | null> {
    return (await this.repo(namespace)).findPreferenceByUserId(userId);
  }

  async savePreference(namespace: string, row: NotificationPreference): Promise<NotificationPreference> {
    return (await this.repo(namespace)).savePreference(row);
  }
}
