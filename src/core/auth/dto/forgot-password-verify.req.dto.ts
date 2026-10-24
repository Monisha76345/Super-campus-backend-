import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class ForgotPasswordVerifyReqDto {
  @ApiProperty({ example: "student@nmit.ac.in", description: "Registered college email" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiPropertyOptional({ example: "nmit", description: "Campus/tenant id" })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
