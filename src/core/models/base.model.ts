import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

/** New tables: camelCase audit columns and soft delete. */
export abstract class BaseCamelCase {
  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @Column({ name: "createdBy", type: "varchar", length: 255, nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @Column({ name: "updatedBy", type: "varchar", length: 255, nullable: true })
  updatedBy: string | null;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @Column({ name: "deletedBy", type: "varchar", length: 255, nullable: true })
  deletedBy: string | null;
}
