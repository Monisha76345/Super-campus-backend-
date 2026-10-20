import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { ROLES } from "src/core/common/constants/roles";
import { JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { CreateMarketplaceItemReqDto } from "../dto/request/create-marketplace-item.req.dto";
import { MarketplaceQueryDto } from "../dto/request/marketplace-query.dto";
import { UpdateItemStatusReqDto } from "../dto/request/update-item-status.req.dto";
import { MarketplaceItemResDto } from "../dto/response/marketplace-item.res.dto";
import { MarketplaceLikeResDto } from "../dto/response/marketplace-like.res.dto";
import { MarketplaceCategory } from "../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../entity/enums/marketplace-condition.enum";
import { MarketplaceStatus } from "../entity/enums/marketplace-status.enum";
import { MarketplaceItem } from "../entity/marketplace-item.model";
import { MarketplaceItemLike } from "../entity/marketplace-like.model";
import { MarketplaceMapper } from "../mapper/marketplace.mapper";
import { MarketplaceDataService } from "./marketplace-data.service";

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly data: MarketplaceDataService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private checkIsAdmin(user: JwtPayload): boolean {
    const roles = user.roles || [];
    return roles.some(
      (r) =>
        r === ROLES.CAMPUS_ADMIN ||
        r === ROLES.SUPER_ADMIN ||
        r === "admin" ||
        r === "CAMPUS_ADMIN",
    );
  }

  async createItem(
    user: JwtPayload,
    dto: CreateMarketplaceItemReqDto,
  ): Promise<MarketplaceItemResDto> {
    const namespace = this.tenantContext.getTenantId();
    const itemId = randomUUID();
    const isAdmin = this.checkIsAdmin(user);

    const item = new MarketplaceItem();
    item.id = itemId;
    item.campusId = namespace;
    item.title = dto.title.trim();
    item.description = dto.description.trim();
    item.price = Number(dto.price);
    item.condition = dto.condition || MarketplaceCondition.GOOD;
    item.category = dto.category || MarketplaceCategory.UNCATEGORIZED;
    item.images = dto.images && dto.images.length > 0 ? dto.images : [];
    item.sellerId = user.sub;
    item.sellerName =
      (user as any).name ||
      (user as any).fullName ||
      user.email?.split("@")[0] ||
      "Campus Member";
    item.sellerRole = isAdmin ? "CAMPUS_ADMIN" : "STUDENT";
    item.likeCount = 0;
    item.createdBy = user.sub;
    item.updatedBy = user.sub;

    if (isAdmin) {
      // Admins are auto-approved and immediately visible to everyone
      item.status = MarketplaceStatus.APPROVED;
      item.approvedBy = user.sub;
      item.approvedAt = new Date();
    } else {
      // Students require admin approval before becoming visible to everyone
      item.status = MarketplaceStatus.PENDING_APPROVAL;
      item.approvedBy = null;
      item.approvedAt = null;
    }

    const saved = await this.data.save(namespace, item);
    return MarketplaceMapper.toResponse(saved, false);
  }

  async findAll(
    user: JwtPayload,
    query: MarketplaceQueryDto,
  ): Promise<MarketplaceItemResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const items = await this.data.findAll(namespace, {
      status: MarketplaceStatus.APPROVED,
      category: query.category,
      condition: query.condition,
      search: query.search,
    });

    const itemIds = items.map((i) => i.id);
    const userLikes = await this.data.getUserLikedItemIds(namespace, user.sub, itemIds);

    return items.map((item) =>
      MarketplaceMapper.toResponse(item, userLikes.has(item.id)),
    );
  }

  async findMyItems(user: JwtPayload): Promise<MarketplaceItemResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const items = await this.data.findMyItems(namespace, user.sub);

    const itemIds = items.map((i) => i.id);
    const userLikes = await this.data.getUserLikedItemIds(namespace, user.sub, itemIds);

    return items.map((item) =>
      MarketplaceMapper.toResponse(item, userLikes.has(item.id)),
    );
  }

  async findPending(user: JwtPayload): Promise<MarketplaceItemResDto[]> {
    if (!this.checkIsAdmin(user)) {
      throw new ForbiddenException("Only campus administrators can access the review queue");
    }
    const namespace = this.tenantContext.getTenantId();
    const items = await this.data.findPending(namespace);

    const itemIds = items.map((i) => i.id);
    const userLikes = await this.data.getUserLikedItemIds(namespace, user.sub, itemIds);

    return items.map((item) =>
      MarketplaceMapper.toResponse(item, userLikes.has(item.id)),
    );
  }

  async findById(user: JwtPayload, id: string): Promise<MarketplaceItemResDto> {
    const namespace = this.tenantContext.getTenantId();
    const item = await this.data.findById(namespace, id);
    if (!item) {
      throw new NotFoundException("Marketplace item not found");
    }

    const like = await this.data.findLike(namespace, id, user.sub);
    return MarketplaceMapper.toResponse(item, !!like);
  }

  async updateStatus(
    user: JwtPayload,
    id: string,
    dto: UpdateItemStatusReqDto,
  ): Promise<MarketplaceItemResDto> {
    const namespace = this.tenantContext.getTenantId();
    const item = await this.data.findById(namespace, id);
    if (!item) {
      throw new NotFoundException("Marketplace item not found");
    }

    const isAdmin = this.checkIsAdmin(user);
    const isSeller = item.sellerId === user.sub;

    if (
      dto.status === MarketplaceStatus.APPROVED ||
      dto.status === MarketplaceStatus.REJECTED
    ) {
      if (!isAdmin) {
        throw new ForbiddenException("Only administrators can approve or reject listings");
      }
      item.status = dto.status;
      item.approvedBy = user.sub;
      item.approvedAt = new Date();
      if (dto.status === MarketplaceStatus.REJECTED) {
        item.rejectionReason = dto.rejectionReason?.trim() || "Item does not meet marketplace standards";
      } else {
        item.rejectionReason = null;
      }
    } else if (dto.status === MarketplaceStatus.SOLD) {
      if (!isAdmin && !isSeller) {
        throw new ForbiddenException("Only the seller or administrator can mark this item as sold");
      }
      item.status = MarketplaceStatus.SOLD;
    } else {
      item.status = dto.status;
    }

    item.updatedBy = user.sub;
    const saved = await this.data.save(namespace, item);
    const like = await this.data.findLike(namespace, id, user.sub);
    return MarketplaceMapper.toResponse(saved, !!like);
  }

  async toggleLike(user: JwtPayload, itemId: string): Promise<MarketplaceLikeResDto> {
    const namespace = this.tenantContext.getTenantId();
    const item = await this.data.findById(namespace, itemId);
    if (!item) {
      throw new NotFoundException("Marketplace item not found");
    }

    const existingLike = await this.data.findLike(namespace, itemId, user.sub);

    if (existingLike) {
      await this.data.deleteLike(namespace, existingLike.id);
      const updatedCount = await this.data.adjustLikeCount(namespace, itemId, -1);
      return { isLiked: false, likeCount: updatedCount };
    } else {
      const newLike = new MarketplaceItemLike();
      newLike.id = randomUUID();
      newLike.campusId = namespace;
      newLike.itemId = itemId;
      newLike.userId = user.sub;
      await this.data.saveLike(namespace, newLike);
      const updatedCount = await this.data.adjustLikeCount(namespace, itemId, 1);
      return { isLiked: true, likeCount: updatedCount };
    }
  }

  async deleteItem(user: JwtPayload, id: string): Promise<void> {
    const namespace = this.tenantContext.getTenantId();
    const item = await this.data.findById(namespace, id);
    if (!item) {
      throw new NotFoundException("Marketplace item not found");
    }

    const isAdmin = this.checkIsAdmin(user);
    const isSeller = item.sellerId === user.sub;
    if (!isAdmin && !isSeller) {
      throw new ForbiddenException("You do not have permission to delete this listing");
    }

    await this.data.softDelete(namespace, id, user.sub);
  }
}
