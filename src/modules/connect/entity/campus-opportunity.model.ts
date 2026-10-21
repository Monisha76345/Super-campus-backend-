import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { OpportunityType } from "./enums/opportunity-type.enum";

@Entity("campus_opportunity")
export class CampusOpportunity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "varchar", length: 150 })
  company: string;

  @Column({ type: "enum", enum: OpportunityType })
  type: OpportunityType;

  @Column({ type: "varchar", length: 150 })
  location: string;

  @Column({ name: "stipend_or_salary", type: "varchar", length: 100, nullable: true })
  stipendOrSalary: string | null;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "apply_url", type: "varchar", length: 500, nullable: true })
  applyUrl: string | null;

  @Column({ type: "datetime", nullable: true })
  deadline: Date | null;

  @Column({ name: "created_by", type: "varchar", length: 36 })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
