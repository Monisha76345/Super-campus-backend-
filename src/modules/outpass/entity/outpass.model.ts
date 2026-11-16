import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { OutpassStatus } from "./enums/outpass-status.enum";
import { PassType } from "./enums/pass-type.enum";

@Entity({ name: "outpass_request" })
export class OutpassRequest extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  studentId: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  studentName: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  usn: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  roomNumber: string | null;

  @Column({ type: "varchar", length: 25, nullable: true })
  parentPhone: string | null;

  @Column({
    type: "enum",
    enum: PassType,
    default: PassType.OUTPASS,
  })
  passType: PassType;

  @Column({ type: "varchar", length: 255 })
  destination: string;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "datetime", precision: 6 })
  departureTime: Date;

  @Column({ type: "datetime", precision: 6 })
  returnTime: Date;

  @Column({
    type: "enum",
    enum: OutpassStatus,
    default: OutpassStatus.PENDING,
  })
  status: OutpassStatus;

  @Column({ type: "varchar", length: 36, nullable: true })
  reviewedBy: string | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  reviewedAt: Date | null;

  @Column({ type: "text", nullable: true })
  rejectionReason: string | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  actualExitTime: Date | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  actualEntryTime: Date | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  qrToken: string | null;
}
