import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ProjectSupportType } from "./enums/project-support-type.enum";
import { Project } from "./project.model";

@Entity({ name: "project_support" })
export class ProjectSupport extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  projectId: string;

  @Column({
    type: "enum",
    enum: ProjectSupportType,
  })
  serviceType: ProjectSupportType;

  @Column({ type: "varchar", length: 255, nullable: true })
  rolesNeeded: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  numberOfStudents: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  commitment: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  preferredSkills: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  mentorDomain: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  fundingDetails: string | null;

  @ManyToOne(() => Project, (project) => project.supportNeeds, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project: Project;
}
