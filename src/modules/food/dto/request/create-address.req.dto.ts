import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class GeoAddrReqDto {
  @ApiProperty()
  @IsString()
  house: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  pincode: string;

  @ApiProperty()
  @IsString()
  landmark: string;
}

export class CreateFoodAddressReqDto {
  @ApiProperty({ example: "Hostel" })
  @IsString()
  address_name: string;

  @ApiProperty({ example: "Block A, NMIT Hostel, Bengaluru" })
  @IsString()
  pretty_address: string;

  @ApiProperty({ example: 13.128 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 77.587 })
  @IsNumber()
  lon: number;

  @ApiProperty({ type: GeoAddrReqDto })
  @IsObject()
  @ValidateNested()
  @Type(() => GeoAddrReqDto)
  geo_addr: GeoAddrReqDto;
}

export class UpdateFoodAddressReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pretty_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lon?: number;

  @ApiPropertyOptional({ type: GeoAddrReqDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GeoAddrReqDto)
  geo_addr?: GeoAddrReqDto;
}
