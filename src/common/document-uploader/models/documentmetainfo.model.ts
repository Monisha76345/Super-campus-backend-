import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";

@Entity("document_meta_info")
export class DocumentMetaInfo extends BaseCamelCase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  refId: string;

  @Column({ nullable: true })
  refType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  userId: string | null;
}
