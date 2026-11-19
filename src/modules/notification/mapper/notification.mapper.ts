import { NotificationPreferenceResDto, NotificationResDto } from "../dto/response/notification.res.dto";
import { AppNotification } from "../entity/notification.model";
import { NotificationPreference } from "../entity/notification-preference.model";

export class NotificationMapper {
  static toResponse(row: AppNotification): NotificationResDto {
    return {
      id: row.id,
      category: row.category,
      type: row.type,
      title: row.title,
      body: row.body,
      data: row.data ?? null,
      actorId: row.actorId ?? null,
      isRead: !!row.readAt,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    };
  }

  static toPreferenceResponse(row: NotificationPreference): NotificationPreferenceResDto {
    return {
      messagesEnabled: !!row.messagesEnabled,
      projectsEnabled: !!row.projectsEnabled,
      outpassEnabled: !!row.outpassEnabled,
      sportsEnabled: !!row.sportsEnabled,
      marketplaceEnabled: !!row.marketplaceEnabled,
      connectEnabled: !!row.connectEnabled,
      campusEnabled: !!row.campusEnabled,
    };
  }

  static defaultPreferences(): NotificationPreferenceResDto {
    return {
      messagesEnabled: true,
      projectsEnabled: true,
      outpassEnabled: true,
      sportsEnabled: true,
      marketplaceEnabled: true,
      connectEnabled: true,
      campusEnabled: true,
    };
  }
}
