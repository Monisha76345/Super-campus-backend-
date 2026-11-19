import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";

@Entity({ name: "notification_preference" })
export class NotificationPreference extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "tinyint", default: 1 })
  messagesEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  projectsEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  outpassEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  sportsEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  marketplaceEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  connectEnabled: number;

  @Column({ type: "tinyint", default: 1 })
  campusEnabled: number;
}
