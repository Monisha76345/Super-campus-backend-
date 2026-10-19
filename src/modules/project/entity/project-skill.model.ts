import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { Project } from "./project.model";

@Entity({ name: "project_skills" })
export class ProjectSkill extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  projectId: string;

  @Column({ type: "varchar", length: 80 })
  skillName: string;

  @ManyToOne(() => Project, (project) => project.skills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project: Project;
}
