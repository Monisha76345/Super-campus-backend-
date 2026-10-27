import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { MarketplaceCategory } from "./enums/marketplace-category.enum";
import { MarketplaceCondition } from "./enums/marketplace-condition.enum";
import { MarketplaceStatus } from "./enums/marketplace-status.enum";

@Entity({ name: "marketplace_items" })
export class MarketplaceItem extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({
    type: "enum",
    enum: MarketplaceCondition,
    default: MarketplaceCondition.GOOD,
  })
  condition: MarketplaceCondition;

  @Column({
    type: "enum",
    enum: MarketplaceCategory,
    default: MarketplaceCategory.UNCATEGORIZED,
  })
  category: MarketplaceCategory;

  @Column({ type: "simple-json", nullable: true })
  images: string[] | null;

  @Column({ type: "varchar", length: 36 })
  sellerId: string;

  @Column({ type: "varchar", length: 255 })
  sellerName: string;

  @Column({ type: "varchar", length: 64 })
  sellerRole: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail: string | null;

  @Column({
    type: "enum",
    enum: MarketplaceStatus,
    default: MarketplaceStatus.PENDING_APPROVAL,
  })
  status: MarketplaceStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  rejectionReason: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  approvedBy: string | null;

  @Column({ type: "datetime", nullable: true })
  approvedAt: Date | null;

  @Column({ type: "int", default: 0 })
  likeCount: number;
}
