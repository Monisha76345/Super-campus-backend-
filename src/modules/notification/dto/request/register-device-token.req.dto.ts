import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDeviceTokenReqDto {
  @ApiProperty({ description: "Expo push token", example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" })
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  token: string;

  @ApiPropertyOptional({ enum: ["IOS", "ANDROID", "WEB", "UNKNOWN"], default: "UNKNOWN" })
  @IsOptional()
  @IsIn(["IOS", "ANDROID", "WEB", "UNKNOWN"])
  platform?: "IOS" | "ANDROID" | "WEB" | "UNKNOWN";
}
