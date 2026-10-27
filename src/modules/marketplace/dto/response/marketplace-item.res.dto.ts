import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MarketplaceCategory } from "../../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../../entity/enums/marketplace-condition.enum";
import { MarketplaceStatus } from "../../entity/enums/marketplace-status.enum";

export class MarketplaceItemResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  campusId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: MarketplaceCondition })
  condition: MarketplaceCondition;

  @ApiProperty({ enum: MarketplaceCategory })
  category: MarketplaceCategory;

  @ApiPropertyOptional({ type: [String] })
  images: string[];

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  sellerRole: string;

  @ApiPropertyOptional()
  contactPhone?: string | null;

  @ApiPropertyOptional()
  contactEmail?: string | null;

  @ApiProperty({ enum: MarketplaceStatus })
  status: MarketplaceStatus;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  approvedBy?: string | null;

  @ApiPropertyOptional()
  approvedAt?: Date | null;

  @ApiProperty()
  likeCount: number;

  @ApiProperty({ description: "Whether the requesting user has liked this item" })
  isLiked: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
