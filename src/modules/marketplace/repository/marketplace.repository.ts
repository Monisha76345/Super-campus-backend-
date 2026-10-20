import { EntityManager, In } from "typeorm";
import { MarketplaceCategory } from "../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../entity/enums/marketplace-condition.enum";
import { MarketplaceStatus } from "../entity/enums/marketplace-status.enum";
import { MarketplaceItem } from "../entity/marketplace-item.model";
import { MarketplaceItemLike } from "../entity/marketplace-like.model";

export class MarketplaceRepository {
  constructor(private readonly manager: EntityManager) {}

  async save(row: MarketplaceItem): Promise<MarketplaceItem> {
    return this.manager.getRepository(MarketplaceItem).save(row);
  }

  async findById(id: string): Promise<MarketplaceItem | null> {
    return this.manager.getRepository(MarketplaceItem).findOne({
      where: { id },
    });
  }

  async findAll(options?: {
    status?: MarketplaceStatus;
    category?: string;
    condition?: MarketplaceCondition;
    search?: string;
  }): Promise<MarketplaceItem[]> {
    const qb = this.manager
      .getRepository(MarketplaceItem)
      .createQueryBuilder("item")
      .orderBy("item.createdAt", "DESC");

    if (options?.status) {
      qb.andWhere("item.status = :status", { status: options.status });
    }

    if (options?.category && options.category.toLowerCase() !== "all") {
      qb.andWhere("item.category = :category", { category: options.category });
    }

    if (options?.condition) {
      qb.andWhere("item.condition = :condition", { condition: options.condition });
    }

    if (options?.search && options.search.trim()) {
      qb.andWhere(
        "(item.title LIKE :search OR item.description LIKE :search)",
        { search: `%${options.search.trim()}%` }
      );
    }

    return qb.getMany();
  }

  async findMyItems(sellerId: string): Promise<MarketplaceItem[]> {
    return this.manager
      .getRepository(MarketplaceItem)
      .createQueryBuilder("item")
      .where("item.sellerId = :sellerId", { sellerId })
      .orderBy("item.createdAt", "DESC")
      .getMany();
  }

  async findPending(): Promise<MarketplaceItem[]> {
    return this.manager
      .getRepository(MarketplaceItem)
      .createQueryBuilder("item")
      .where("item.status = :status", { status: MarketplaceStatus.PENDING_APPROVAL })
      .orderBy("item.createdAt", "DESC")
      .getMany();
  }

  async softDelete(id: string, actorId: string): Promise<void> {
    const item = await this.findById(id);
    if (!item) return;
    item.deletedBy = actorId;
    item.deletedAt = new Date();
    await this.manager.getRepository(MarketplaceItem).save(item);
  }

  async findLike(itemId: string, userId: string): Promise<MarketplaceItemLike | null> {
    return this.manager.getRepository(MarketplaceItemLike).findOne({
      where: { itemId, userId },
    });
  }

  async saveLike(like: MarketplaceItemLike): Promise<MarketplaceItemLike> {
    return this.manager.getRepository(MarketplaceItemLike).save(like);
  }

  async deleteLike(id: string): Promise<void> {
    await this.manager.getRepository(MarketplaceItemLike).delete(id);
  }

  async getUserLikedItemIds(userId: string, itemIds: string[]): Promise<Set<string>> {
    if (!itemIds.length) return new Set();
    const likes = await this.manager.getRepository(MarketplaceItemLike).find({
      where: {
        userId,
        itemId: In(itemIds),
      },
      select: ["itemId"],
    });
    return new Set(likes.map((l) => l.itemId));
  }

  async adjustLikeCount(itemId: string, delta: number): Promise<number> {
    await this.manager
      .createQueryBuilder()
      .update(MarketplaceItem)
      .set({
        likeCount: () => `GREATEST(0, likeCount + (${delta}))`,
      })
      .where("id = :id", { id: itemId })
      .execute();

    const updated = await this.findById(itemId);
    return updated?.likeCount ?? 0;
  }
}
