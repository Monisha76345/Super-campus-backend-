import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { DirectoryRole } from "src/modules/user/entity/enums/directory-role.enum";
import { UserService } from "src/modules/user/service/user.service";
import { RegisterDeviceTokenReqDto } from "../dto/request/register-device-token.req.dto";
import { UpdateNotificationPreferenceReqDto } from "../dto/request/update-preference.req.dto";
import {
  NotificationPreferenceResDto,
  NotificationResDto,
  UnreadCountResDto,
} from "../dto/response/notification.res.dto";
import { DeviceToken } from "../entity/device-token.model";
import { NotificationCategory } from "../entity/enums/notification-category.enum";
import { NotificationType } from "../entity/enums/notification-type.enum";
import { AppNotification } from "../entity/notification.model";
import { NotificationPreference } from "../entity/notification-preference.model";
import { NotificationMapper } from "../mapper/notification.mapper";
import { ExpoPushService } from "./expo-push.service";
import { NotificationDataService } from "./notification-data.service";

export interface CreateNotificationInput {
  userIds: string[];
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actorId?: string | null;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly data: NotificationDataService,
    private readonly expoPush: ExpoPushService,
    private readonly tenantContext: TenantContextService,
    private readonly userService: UserService,
  ) {}

  private get namespace(): string {
    return this.tenantContext.getTenantId();
  }

  /**
   * Create inbox rows + fan-out Expo push for eligible recipients.
   * Safe to call fire-and-forget from feature services (errors are logged, not thrown to callers).
   */
  async notify(input: CreateNotificationInput): Promise<void> {
    try {
      const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
      const recipients = input.actorId
        ? uniqueIds.filter((id) => id !== input.actorId)
        : uniqueIds;
      if (!recipients.length) return;

      const namespace = this.namespace;
      const eligible: string[] = [];
      for (const userId of recipients) {
        const allowed = await this.isCategoryEnabled(namespace, userId, input.category);
        if (allowed) eligible.push(userId);
      }
      if (!eligible.length) return;

      const rows = eligible.map((userId) => {
        const row = new AppNotification();
        row.id = randomUUID();
        row.userId = userId;
        row.category = input.category;
        row.type = input.type;
        row.title = input.title.slice(0, 255);
        row.body = input.body;
        row.data = input.data ?? null;
        row.actorId = input.actorId ?? null;
        row.readAt = null;
        row.createdBy = input.actorId ?? null;
        row.updatedBy = input.actorId ?? null;
        return row;
      });

      await this.data.saveNotifications(namespace, rows);

      const tokens = await this.data.findDeviceTokensByUserIds(namespace, eligible);
      if (!tokens.length) return;

      await this.expoPush.send(
        tokens.map((t) => ({
          to: t.token,
          title: input.title,
          body: input.body,
          sound: "default",
          channelId: "campus-alerts",
          data: {
            ...(input.data ?? {}),
            notificationType: input.type,
            category: input.category,
          },
        })),
      );
    } catch (err: unknown) {
      this.logger.warn(`notify failed: ${(err as Error).message}`);
    }
  }

  async notifyRoles(
    roles: DirectoryRole[],
    input: Omit<CreateNotificationInput, "userIds">,
  ): Promise<void> {
    try {
      const userIds = await this.userService.findUserIdsByRoles(this.namespace, roles);
      await this.notify({ ...input, userIds });
    } catch (err: unknown) {
      this.logger.warn(`notifyRoles failed: ${(err as Error).message}`);
    }
  }

  async listInbox(userId: string, limit = 50, offset = 0): Promise<NotificationResDto[]> {
    const rows = await this.data.findByUserId(this.namespace, userId, limit, offset);
    return rows.map(NotificationMapper.toResponse);
  }

  async unreadCount(userId: string): Promise<UnreadCountResDto> {
    const count = await this.data.countUnread(this.namespace, userId);
    return { count };
  }

  async markRead(userId: string, id: string): Promise<NotificationResDto> {
    const row = await this.data.markRead(this.namespace, id, userId);
    if (!row) throw new NotFoundException("Notification not found");
    return NotificationMapper.toResponse(row);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const updated = await this.data.markAllRead(this.namespace, userId);
    return { updated };
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenReqDto): Promise<{ ok: true }> {
    const namespace = this.namespace;
    const token = dto.token.trim();
    const existing = await this.data.findDeviceTokenByToken(namespace, token);
    const now = new Date();

    if (existing) {
      existing.userId = userId;
      existing.platform = dto.platform || existing.platform || "UNKNOWN";
      existing.lastSeenAt = now;
      existing.updatedBy = userId;
      existing.deletedAt = null;
      existing.deletedBy = null;
      await this.data.saveDeviceToken(namespace, existing);
      return { ok: true };
    }

    const row = new DeviceToken();
    row.id = randomUUID();
    row.userId = userId;
    row.token = token;
    row.platform = dto.platform || "UNKNOWN";
    row.lastSeenAt = now;
    row.createdBy = userId;
    row.updatedBy = userId;
    await this.data.saveDeviceToken(namespace, row);
    return { ok: true };
  }

  async unregisterDeviceToken(userId: string, token: string): Promise<{ ok: true }> {
    await this.data.softDeleteDeviceToken(this.namespace, token.trim(), userId);
    return { ok: true };
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceResDto> {
    const row = await this.data.findPreferenceByUserId(this.namespace, userId);
    if (!row) return NotificationMapper.defaultPreferences();
    return NotificationMapper.toPreferenceResponse(row);
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferenceReqDto,
  ): Promise<NotificationPreferenceResDto> {
    const namespace = this.namespace;
    let row = await this.data.findPreferenceByUserId(namespace, userId);
    if (!row) {
      row = new NotificationPreference();
      row.id = randomUUID();
      row.userId = userId;
      row.messagesEnabled = 1;
      row.projectsEnabled = 1;
      row.outpassEnabled = 1;
      row.sportsEnabled = 1;
      row.marketplaceEnabled = 1;
      row.connectEnabled = 1;
      row.campusEnabled = 1;
      row.createdBy = userId;
    }

    if (dto.messagesEnabled !== undefined) row.messagesEnabled = dto.messagesEnabled ? 1 : 0;
    if (dto.projectsEnabled !== undefined) row.projectsEnabled = dto.projectsEnabled ? 1 : 0;
    if (dto.outpassEnabled !== undefined) row.outpassEnabled = dto.outpassEnabled ? 1 : 0;
    if (dto.sportsEnabled !== undefined) row.sportsEnabled = dto.sportsEnabled ? 1 : 0;
    if (dto.marketplaceEnabled !== undefined) row.marketplaceEnabled = dto.marketplaceEnabled ? 1 : 0;
    if (dto.connectEnabled !== undefined) row.connectEnabled = dto.connectEnabled ? 1 : 0;
    if (dto.campusEnabled !== undefined) row.campusEnabled = dto.campusEnabled ? 1 : 0;
    row.updatedBy = userId;

    const saved = await this.data.savePreference(namespace, row);
    return NotificationMapper.toPreferenceResponse(saved);
  }

  private async isCategoryEnabled(
    namespace: string,
    userId: string,
    category: NotificationCategory,
  ): Promise<boolean> {
    const prefs = await this.data.findPreferenceByUserId(namespace, userId);
    if (!prefs) return true;
    switch (category) {
      case NotificationCategory.MESSAGES:
        return !!prefs.messagesEnabled;
      case NotificationCategory.PROJECTS:
        return !!prefs.projectsEnabled;
      case NotificationCategory.OUTPASS:
        return !!prefs.outpassEnabled;
      case NotificationCategory.SPORTS:
        return !!prefs.sportsEnabled;
      case NotificationCategory.MARKETPLACE:
        return !!prefs.marketplaceEnabled;
      case NotificationCategory.CONNECT:
        return !!prefs.connectEnabled;
      case NotificationCategory.CAMPUS:
        return !!prefs.campusEnabled;
      default:
        return true;
    }
  }
}
