import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";

@Entity({ name: "sports_facility_closures" })
export class SportsFacilityClosure extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  facilityId: string;

  @Column({ type: "date" })
  closureDate: string;

  @Column({ type: "time" })
  startTime: string;

  @Column({ type: "time" })
  endTime: string;

  @Column({ type: "varchar", length: 255 })
  reason: string;
}
