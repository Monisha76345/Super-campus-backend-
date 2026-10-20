import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "marketplace_item_likes" })
@Index(["itemId", "userId"], { unique: true })
export class MarketplaceItemLike {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  itemId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;
}
