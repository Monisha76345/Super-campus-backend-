import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { FoodDeliveryType, FoodOrderItemReqDto } from "./update-cart.req.dto";

export enum FoodPaymentType {
  RAZORPAY = "RAZORPAY",
  COD = "COD",
}

export class CreateFoodOrderReqDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  business_id: string;

  @ApiProperty({
    format: "uuid",
    description: "Generate once per checkout attempt; reuse only for identical retries",
  })
  @IsUUID()
  checkout_id: string;

  @ApiProperty({ enum: FoodDeliveryType, default: FoodDeliveryType.SELF_PICK_UP })
  @IsEnum(FoodDeliveryType)
  delivery_type: FoodDeliveryType = FoodDeliveryType.SELF_PICK_UP;

  @ApiProperty({ enum: FoodPaymentType, default: FoodPaymentType.COD })
  @IsEnum(FoodPaymentType)
  payment_type: FoodPaymentType = FoodPaymentType.COD;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promo_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  table_number?: string;
}
