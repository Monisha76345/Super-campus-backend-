import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { MarketplaceStatus } from "../../entity/enums/marketplace-status.enum";

export class UpdateItemStatusReqDto {
  @ApiProperty({
    enum: MarketplaceStatus,
    example: MarketplaceStatus.APPROVED,
    description: "New status for the marketplace item",
  })
  @IsNotEmpty()
  @IsEnum(MarketplaceStatus)
  status: MarketplaceStatus;

  @ApiPropertyOptional({
    example: "Item does not comply with campus safety guidelines",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rejectionReason?: string;
}
