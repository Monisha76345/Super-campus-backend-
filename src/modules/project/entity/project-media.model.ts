import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { Project } from "./project.model";

@Entity({ name: "project_media" })
export class ProjectMedia extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  projectId: string;

  @Column({ type: "varchar", length: 20, default: "IMAGE" })
  mediaType: string;

  @Column({ type: "varchar", length: 500 })
  fileUrl: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  fileName: string | null;

  @ManyToOne(() => Project, (project) => project.media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project: Project;
}
