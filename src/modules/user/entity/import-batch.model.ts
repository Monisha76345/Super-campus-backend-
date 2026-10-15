import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ImportBatchStatus } from "./enums/import-batch-status.enum";

@Entity("import_batch")
export class ImportBatch extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  fileName: string;

  @Column({ type: "varchar", length: 255 })
  uploadedBy: string;

  @Column({ type: "enum", enum: ImportBatchStatus, default: ImportBatchStatus.PROCESSING })
  status: ImportBatchStatus;

  @Column({ type: "int", default: 0 })
  totalRows: number;

  @Column({ type: "int", default: 0 })
  createdCount: number;

  @Column({ type: "int", default: 0 })
  updatedCount: number;

  @Column({ type: "int", default: 0 })
  skippedCount: number;

  @Column({ type: "int", default: 0 })
  errorCount: number;

  @Column({ type: "text", nullable: true })
  errorDetails: string | null;
}
