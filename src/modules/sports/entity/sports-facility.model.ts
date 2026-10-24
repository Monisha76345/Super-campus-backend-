import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { SportType } from "./enums/sport-type.enum";
import { VenueType } from "./enums/venue-type.enum";

@Entity({ name: "sports_facilities" })
export class SportsFacility extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "varchar",
    length: 64,
    default: SportType.BADMINTON,
  })
  sportType: SportType;

  @Column({
    type: "varchar",
    length: 32,
    default: VenueType.INDOOR,
  })
  venueType: VenueType;

  @Column({ type: "varchar", length: 255 })
  location: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "text", nullable: true })
  rules: string | null;

  @Column({ type: "time", default: "06:00:00" })
  openingTime: string;

  @Column({ type: "time", default: "22:00:00" })
  closingTime: string;

  @Column({ type: "int", default: 60 })
  slotDurationMinutes: number;

  @Column({ type: "int", default: 4 })
  maxPlayers: number;

  @Column({ type: "tinyint", default: 1 })
  isActive: number;
}
