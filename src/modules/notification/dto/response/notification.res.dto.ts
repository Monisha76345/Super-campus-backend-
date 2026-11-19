import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationCategory } from "../../entity/enums/notification-category.enum";
import { NotificationType } from "../../entity/enums/notification-type.enum";

export class NotificationResDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationCategory })
  category: NotificationCategory;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ nullable: true, type: Object })
  data: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  actorId: string | null;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: string;
}

export class NotificationPreferenceResDto {
  @ApiProperty()
  messagesEnabled: boolean;

  @ApiProperty()
  projectsEnabled: boolean;

  @ApiProperty()
  outpassEnabled: boolean;

  @ApiProperty()
  sportsEnabled: boolean;

  @ApiProperty()
  marketplaceEnabled: boolean;

  @ApiProperty()
  connectEnabled: boolean;

  @ApiProperty()
  campusEnabled: boolean;
}

export class UnreadCountResDto {
  @ApiProperty({ example: 3 })
  count: number;
}
