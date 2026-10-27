import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { MarketplaceCategory } from "../../entity/enums/marketplace-category.enum";
import { MarketplaceCondition } from "../../entity/enums/marketplace-condition.enum";

export class CreateMarketplaceItemReqDto {
  @ApiProperty({ example: "Data structures textbook", maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: "3rd semester VTU syllabus, gently used, no torn pages." })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    enum: MarketplaceCondition,
    default: MarketplaceCondition.GOOD,
  })
  @IsOptional()
  @IsEnum(MarketplaceCondition)
  condition?: MarketplaceCondition;

  @ApiPropertyOptional({
    enum: MarketplaceCategory,
    default: MarketplaceCategory.UNCATEGORIZED,
  })
  @IsOptional()
  @IsEnum(MarketplaceCategory)
  category?: MarketplaceCategory;

  @ApiPropertyOptional({
    type: [String],
    example: ["https://example.com/photos/item1.jpg"],
    description: "Up to 4 photo URLs",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: "+91 9876543210", description: "Seller contact phone or WhatsApp" })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: "student@campus.edu", description: "Seller contact email" })
  @IsOptional()
  @IsString()
  contactEmail?: string;
}
