import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";

@Entity({ name: "device_token" })
export class DeviceToken extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 512 })
  token: string;

  @Column({ type: "varchar", length: 16, default: "UNKNOWN" })
  platform: string;

  @Column({ type: "datetime", precision: 6 })
  lastSeenAt: Date;
}
