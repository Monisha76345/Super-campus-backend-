import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { AccountStatus } from "./enums/account-status.enum";

@Entity({ name: "user" })
export class UserAccount extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  directoryId: string;

  @Column({ type: "varchar", length: 255 })
  loginId: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "enum", enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Column({ type: "boolean", default: false })
  changePasswordRequired: boolean;

  @Column({ type: "datetime", precision: 6, nullable: true })
  lastLoggedIn: Date | null;
}
