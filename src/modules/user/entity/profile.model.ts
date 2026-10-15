import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ProfileVisibility } from "./enums/profile-visibility.enum";
import { ResidencyStatus } from "./enums/residency-status.enum";
import { EducationItem, ExperienceItem, SkillItem } from "./profile-items";

@Entity("profile")
export class UserProfile extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  firstName: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  lastName: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  handle: string | null;

  @Column({ type: "smallint", nullable: true })
  graduationYear: number | null;

  @Column({ type: "enum", enum: ProfileVisibility, default: ProfileVisibility.CAMPUS })
  visibility: ProfileVisibility;

  @Column({ type: "enum", enum: ResidencyStatus, default: ResidencyStatus.NOT_SET })
  residency: ResidencyStatus;

  @Column({ type: "varchar", length: 500, nullable: true })
  bio: string | null;

  @Column({ type: "int", nullable: true })
  photoDocumentId: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  photoKey: string | null;

  @Column({ type: "json", nullable: true })
  education: EducationItem[] | null;

  @Column({ type: "json", nullable: true })
  experience: ExperienceItem[] | null;

  @Column({ type: "json", nullable: true })
  skills: SkillItem[] | null;
}
