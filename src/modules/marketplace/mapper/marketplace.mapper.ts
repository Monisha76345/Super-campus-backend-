import { MarketplaceItemResDto } from "../dto/response/marketplace-item.res.dto";
import { MarketplaceItem } from "../entity/marketplace-item.model";

export class MarketplaceMapper {
  static toResponse(row: MarketplaceItem, isLiked = false): MarketplaceItemResDto {
    return {
      id: row.id,
      campusId: row.campusId,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      condition: row.condition,
      category: row.category,
      images: Array.isArray(row.images) ? row.images : [],
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      sellerRole: row.sellerRole,
      status: row.status,
      rejectionReason: row.rejectionReason ?? null,
      approvedBy: row.approvedBy ?? null,
      approvedAt: row.approvedAt ?? null,
      likeCount: Number(row.likeCount) || 0,
      isLiked,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
