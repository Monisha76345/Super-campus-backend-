import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ProjectCategory } from "./enums/project-category.enum";
import { ProjectStage } from "./enums/project-stage.enum";
import { ProjectStatus } from "./enums/project-status.enum";
import { ProjectVisibility } from "./enums/project-visibility.enum";
import { ProjectSkill } from "./project-skill.model";
import { ProjectSupport } from "./project-support.model";
import { ProjectMedia } from "./project-media.model";

@Entity({ name: "projects" })
export class Project extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  creatorId: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  creatorName: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  creatorUsn: string | null;

  @Column({ type: "varchar", length: 140 })
  title: string;

  @Column({ type: "varchar", length: 200 })
  shortDescription: string;

  @Column({ type: "text", nullable: true })
  moreDetails: string | null;

  @Column({
    type: "enum",
    enum: ProjectCategory,
    default: ProjectCategory.ACADEMIC,
  })
  category: ProjectCategory;

  @Column({
    type: "enum",
    enum: ProjectStage,
    default: ProjectStage.IDEA,
  })
  stage: ProjectStage;

  @Column({
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.OPEN,
  })
  status: ProjectStatus;

  @Column({ type: "varchar", length: 50, default: "3 - 6 Months" })
  duration: string;

  @Column({ type: "varchar", length: 120, default: "NMIT North Campus" })
  location: string;

  @Column({
    type: "enum",
    enum: ProjectVisibility,
    default: ProjectVisibility.CAMPUS_ONLY,
  })
  visibility: ProjectVisibility;

  @Column({ type: "varchar", length: 500, nullable: true })
  bannerUrl: string | null;

  @OneToMany(() => ProjectSkill, (skill) => skill.project, { cascade: true })
  skills: ProjectSkill[];

  @OneToMany(() => ProjectSupport, (support) => support.project, { cascade: true })
  supportNeeds: ProjectSupport[];

  @OneToMany(() => ProjectMedia, (media) => media.project, { cascade: true })
  media: ProjectMedia[];
}
