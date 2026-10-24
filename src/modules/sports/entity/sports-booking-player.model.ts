import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { PlayerRole } from "./enums/booking-status.enum";

@Entity({ name: "sports_booking_players" })
export class SportsBookingPlayer extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  bookingId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 255 })
  userName: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  userUsn: string | null;

  @Column({
    type: "enum",
    enum: PlayerRole,
    default: PlayerRole.PLAYER,
  })
  role: PlayerRole;

  @Column({ type: "varchar", length: 64 })
  qrToken: string;

  @Column({ type: "datetime" })
  joinedAt: Date;
}
