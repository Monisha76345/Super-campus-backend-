import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { MarketplaceCategory } from "../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../entity/enums/marketplace-condition.enum";
import { MarketplaceStatus } from "../entity/enums/marketplace-status.enum";
import { MarketplaceItem } from "../entity/marketplace-item.model";
import { MarketplaceItemLike } from "../entity/marketplace-like.model";
import { MarketplaceRepository } from "../repository/marketplace.repository";

@Injectable()
export class MarketplaceDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<MarketplaceRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new MarketplaceRepository(manager);
  }

  async save(namespace: string, row: MarketplaceItem): Promise<MarketplaceItem> {
    return (await this.repo(namespace)).save(row);
  }

  async findById(namespace: string, id: string): Promise<MarketplaceItem | null> {
    return (await this.repo(namespace)).findById(id);
  }

  async findAll(
    namespace: string,
    options?: {
      status?: MarketplaceStatus;
      category?: string;
      condition?: MarketplaceCondition;
      search?: string;
    },
  ): Promise<MarketplaceItem[]> {
    return (await this.repo(namespace)).findAll(options);
  }

  async findMyItems(namespace: string, sellerId: string): Promise<MarketplaceItem[]> {
    return (await this.repo(namespace)).findMyItems(sellerId);
  }

  async findPending(namespace: string): Promise<MarketplaceItem[]> {
    return (await this.repo(namespace)).findPending();
  }

  async softDelete(namespace: string, id: string, actorId: string): Promise<void> {
    return (await this.repo(namespace)).softDelete(id, actorId);
  }

  async findLike(namespace: string, itemId: string, userId: string): Promise<MarketplaceItemLike | null> {
    return (await this.repo(namespace)).findLike(itemId, userId);
  }

  async saveLike(namespace: string, like: MarketplaceItemLike): Promise<MarketplaceItemLike> {
    return (await this.repo(namespace)).saveLike(like);
  }

  async deleteLike(namespace: string, id: string): Promise<void> {
    return (await this.repo(namespace)).deleteLike(id);
  }

  async getUserLikedItemIds(namespace: string, userId: string, itemIds: string[]): Promise<Set<string>> {
    return (await this.repo(namespace)).getUserLikedItemIds(userId, itemIds);
  }

  async adjustLikeCount(namespace: string, itemId: string, delta: number): Promise<number> {
    return (await this.repo(namespace)).adjustLikeCount(itemId, delta);
  }
}
