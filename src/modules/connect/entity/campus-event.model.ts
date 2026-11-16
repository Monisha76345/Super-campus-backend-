import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { EventStatus } from "./enums/event-status.enum";

@Entity("campus_event")
export class CampusEvent {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", length: 255 })
  venue: string;

  @Column({ name: "starts_at", type: "datetime" })
  startsAt: Date;

  @Column({ name: "ends_at", type: "datetime" })
  endsAt: Date;

  @Column({ type: "int", nullable: true })
  capacity: number | null;

  @Column({ name: "registered_count", type: "int", default: 0 })
  registeredCount: number;

  @Column({ name: "banner_key", type: "varchar", length: 100, nullable: true })
  bannerKey: string | null;

  @Column({ name: "google_forms_url", type: "varchar", length: 500, nullable: true })
  googleFormsUrl: string | null;

  @Column({ type: "enum", enum: EventStatus, default: EventStatus.UPCOMING })
  status: EventStatus;

  @Column({ name: "created_by", type: "varchar", length: 36 })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
