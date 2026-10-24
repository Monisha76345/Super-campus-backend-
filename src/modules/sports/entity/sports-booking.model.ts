import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { BookingStatus } from "./enums/booking-status.enum";

@Entity({ name: "sports_bookings" })
export class SportsBooking extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  facilityId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 255 })
  userName: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  userUsn: string | null;

  @Column({ type: "date" })
  bookingDate: string;

  @Column({ type: "time" })
  startTime: string;

  @Column({ type: "time" })
  endTime: string;

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @Column({ type: "varchar", length: 16 })
  inviteCode: string;

  @Column({ type: "tinyint", default: 0 })
  isOpenGame: number;

  @Column({ type: "int", default: 4 })
  maxPlayers: number;

  @Column({ type: "int", default: 1 })
  currentPlayersCount: number;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "text", nullable: true })
  cancellationReason: string | null;

  @Column({ type: "varchar", length: 64 })
  qrToken: string;
}
