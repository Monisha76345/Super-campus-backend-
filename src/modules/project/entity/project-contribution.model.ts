import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "project_contributions" })
export class ProjectContribution {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  projectId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 120 })
  contributorName: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  contributorEmail: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  contributorRole: string | null;

  @Column({ type: "enum", enum: ["COLLEGE_FUNDING", "CROWDFUNDING"] })
  fundingType: "COLLEGE_FUNDING" | "CROWDFUNDING";

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "varchar", length: 50, default: "CAMPUS_PAY" })
  paymentMethod: string;

  @Column({ type: "varchar", length: 100 })
  transactionId: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  orderId: string | null;

  @Column({ type: "enum", enum: ["PENDING", "VERIFIED", "FAILED"], default: "VERIFIED" })
  paymentStatus: "PENDING" | "VERIFIED" | "FAILED";

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "datetime", nullable: true })
  verifiedAt: Date | null;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

