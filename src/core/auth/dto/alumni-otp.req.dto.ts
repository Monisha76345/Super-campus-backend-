import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class AlumniOtpReqDto {
  @ApiProperty({ example: "1NT22AD015" })
  @IsString()
  @MinLength(1)
  usn: string;

  @ApiProperty({ example: "9876543210" })
  @IsString()
  @MinLength(10)
  mobile: string;

  @ApiPropertyOptional({ example: "nmit" })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
