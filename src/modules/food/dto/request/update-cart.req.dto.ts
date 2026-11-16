import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export enum FoodDeliveryType {
  SELF_PICK_UP = "SELF_PICK_UP",
  DA_DELIVERY = "DA_DELIVERY",
  DINE_IN = "DINE_IN",
}

export class FoodAddonReqDto {
  @ApiProperty()
  @IsInt()
  addon_id: number;

  @ApiProperty()
  @IsInt()
  addon_list_id: number;

  @ApiProperty()
  @IsString()
  addon_list_name: string;
}

export class FoodOrderItemReqDto {
  @ApiProperty({ example: 501 })
  @IsInt()
  sku_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ type: [FoodAddonReqDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodAddonReqDto)
  addons?: FoodAddonReqDto[];
}

export class UpdateFoodCartReqDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  business_id: string;

  @ApiProperty({ enum: FoodDeliveryType, default: FoodDeliveryType.SELF_PICK_UP })
  @IsEnum(FoodDeliveryType)
  delivery_type: FoodDeliveryType = FoodDeliveryType.SELF_PICK_UP;

  @ApiProperty({ type: [FoodOrderItemReqDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FoodOrderItemReqDto)
  order_items: FoodOrderItemReqDto[];

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  delivery_address_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_note?: string;
}
