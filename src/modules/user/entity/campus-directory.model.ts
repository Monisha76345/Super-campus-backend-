import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { DirectoryRole } from "./enums/directory-role.enum";
import { DirectoryStatus } from "./enums/directory-status.enum";

@Entity("campus_directory")
export class CampusDirectory extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 32 })
  usn: string;

  @Column({ type: "varchar", length: 255 })
  fullName: string;

  @Column({ type: "varchar", length: 255 })
  collegeEmail: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  personalEmail: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  mobile: string | null;

  @Column({ type: "enum", enum: DirectoryRole })
  role: DirectoryRole;

  @Column({ type: "boolean", default: false })
  isHostelite: boolean;

  @Column({ type: "varchar", length: 120, nullable: true })
  department: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  batch: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  program: string | null;

  @Column({ type: "enum", enum: DirectoryStatus, default: DirectoryStatus.PENDING })
  status: DirectoryStatus;

  @Column({ type: "varchar", length: 36, nullable: true })
  userId: string | null;
}
