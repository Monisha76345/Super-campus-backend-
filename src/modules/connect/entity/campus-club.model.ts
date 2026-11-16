import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("campus_club")
export class CampusClub {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 150 })
  name: string;

  @Column({ type: "varchar", length: 80 })
  category: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "lead_user_id", type: "varchar", length: 36, nullable: true })
  leadUserId: string | null;

  @Column({ name: "lead_name", type: "varchar", length: 255, nullable: true })
  leadName: string | null;

  @Column({ name: "meeting_schedule", type: "varchar", length: 255, nullable: true })
  meetingSchedule: string | null;

  @Column({ name: "room_or_venue", type: "varchar", length: 255, nullable: true })
  roomOrVenue: string | null;

  @Column({ name: "contact_email", type: "varchar", length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: "members_data", type: "json", nullable: true })
  membersData: any[] | null;

  @Column({ name: "member_count", type: "int", default: 1 })
  memberCount: number;

  @Column({ name: "banner_key", type: "varchar", length: 100, nullable: true })
  bannerKey: string | null;

  @Column({ type: "enum", enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  status: "ACTIVE" | "INACTIVE";

  @Column({ name: "created_by", type: "varchar", length: 36 })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
