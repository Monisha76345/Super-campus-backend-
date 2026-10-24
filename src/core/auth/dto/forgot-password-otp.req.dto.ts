import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ForgotPasswordOtpReqDto {
  @ApiProperty({ example: "student@nmit.ac.in", description: "Registered college email" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: "nmit", description: "Campus/tenant id" })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
