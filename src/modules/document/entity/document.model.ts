import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { DocumentRefType } from "./enums/document-ref-type.enum";
import { DocumentStatus } from "./enums/document-status.enum";

@Entity("document")
export class Document extends BaseCamelCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  refId: string;

  @Column({ type: "enum", enum: DocumentRefType, nullable: false })
  refType: DocumentRefType;

  @Column({ type: "varchar", length: 30, nullable: false })
  type: string;

  @Column({ type: "varchar", length: 127, nullable: false })
  mimeType: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  location: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  contentId: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  url: string | null;

  @Column({ type: "enum", enum: DocumentStatus, default: DocumentStatus.ACTIVE, nullable: false })
  status: DocumentStatus;
}
