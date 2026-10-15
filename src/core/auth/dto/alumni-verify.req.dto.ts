import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, MinLength } from "class-validator";

export class AlumniVerifyReqDto {
  @ApiProperty({ example: "1NT22AD015" })
  @IsString()
  @MinLength(1)
  usn: string;

  @ApiProperty({ example: "9876543210" })
  @IsString()
  @MinLength(10)
  mobile: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: "nmit" })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
