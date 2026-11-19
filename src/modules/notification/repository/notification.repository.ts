import { EntityManager, IsNull } from "typeorm";
import { DeviceToken } from "../entity/device-token.model";
import { AppNotification } from "../entity/notification.model";
import { NotificationPreference } from "../entity/notification-preference.model";

export class NotificationRepository {
  constructor(private readonly manager: EntityManager) {}

  saveNotification(row: AppNotification): Promise<AppNotification> {
    return this.manager.getRepository(AppNotification).save(row);
  }

  saveNotifications(rows: AppNotification[]): Promise<AppNotification[]> {
    return this.manager.getRepository(AppNotification).save(rows);
  }

  findByUserId(userId: string, limit = 50, offset = 0): Promise<AppNotification[]> {
    return this.manager.getRepository(AppNotification).find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  findByIdForUser(id: string, userId: string): Promise<AppNotification | null> {
    return this.manager.getRepository(AppNotification).findOne({ where: { id, userId } });
  }

  countUnread(userId: string): Promise<number> {
    return this.manager.getRepository(AppNotification).count({
      where: { userId, readAt: IsNull() },
    });
  }

  async markRead(id: string, userId: string): Promise<AppNotification | null> {
    const row = await this.findByIdForUser(id, userId);
    if (!row) return null;
    if (!row.readAt) {
      row.readAt = new Date();
      row.updatedBy = userId;
      return this.saveNotification(row);
    }
    return row;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.manager
      .getRepository(AppNotification)
      .createQueryBuilder()
      .update(AppNotification)
      .set({ readAt: () => "CURRENT_TIMESTAMP(6)", updatedBy: userId })
      .where("userId = :userId", { userId })
      .andWhere("readAt IS NULL")
      .andWhere("deletedAt IS NULL")
      .execute();
    return result.affected ?? 0;
  }

  findDeviceTokenByToken(token: string): Promise<DeviceToken | null> {
    return this.manager.getRepository(DeviceToken).findOne({
      where: { token },
      withDeleted: true,
    });
  }

  findDeviceTokensByUserIds(userIds: string[]): Promise<DeviceToken[]> {
    if (!userIds.length) return Promise.resolve([]);
    return this.manager
      .getRepository(DeviceToken)
      .createQueryBuilder("d")
      .where("d.userId IN (:...userIds)", { userIds })
      .andWhere("d.deletedAt IS NULL")
      .getMany();
  }

  saveDeviceToken(row: DeviceToken): Promise<DeviceToken> {
    return this.manager.getRepository(DeviceToken).save(row);
  }

  async softDeleteDeviceToken(token: string, userId: string): Promise<void> {
    await this.manager
      .getRepository(DeviceToken)
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ deletedAt: () => "CURRENT_TIMESTAMP(6)", deletedBy: userId })
      .where("token = :token", { token })
      .andWhere("userId = :userId", { userId })
      .andWhere("deletedAt IS NULL")
      .execute();
  }

  findPreferenceByUserId(userId: string): Promise<NotificationPreference | null> {
    return this.manager.getRepository(NotificationPreference).findOne({ where: { userId } });
  }

  savePreference(row: NotificationPreference): Promise<NotificationPreference> {
    return this.manager.getRepository(NotificationPreference).save(row);
  }
}
