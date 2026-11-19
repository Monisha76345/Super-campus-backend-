import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { NotificationCategory } from "./enums/notification-category.enum";
import { NotificationType } from "./enums/notification-type.enum";

@Entity({ name: "notification" })
export class AppNotification extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 32 })
  category: NotificationCategory;

  @Column({ type: "varchar", length: 64 })
  type: NotificationType;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "json", nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  actorId: string | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  readAt: Date | null;
}
