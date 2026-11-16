import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "project_applications" })
export class ProjectApplication {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  projectId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 120 })
  applicantName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  applicantEmail: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  applicantRole: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  applicantUsn: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  supportId: string | null;

  @Column({ type: "varchar", length: 100 })
  roleApplied: string;

  @Column({ type: "text", nullable: true })
  message: string | null;

  @Column({ type: "enum", enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" })
  status: "PENDING" | "ACCEPTED" | "REJECTED";

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

