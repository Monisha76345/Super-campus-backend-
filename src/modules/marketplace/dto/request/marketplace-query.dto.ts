import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { MarketplaceCategory } from "../../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../../entity/enums/marketplace-condition.enum";
import { MarketplaceStatus } from "../../entity/enums/marketplace-status.enum";

export class MarketplaceQueryDto {
  @ApiPropertyOptional({ enum: MarketplaceCategory })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: MarketplaceCondition })
  @IsOptional()
  @IsEnum(MarketplaceCondition)
  condition?: MarketplaceCondition;

  @ApiPropertyOptional({ example: "laptop" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MarketplaceStatus })
  @IsOptional()
  @IsEnum(MarketplaceStatus)
  status?: MarketplaceStatus;
}
