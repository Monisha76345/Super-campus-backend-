import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ForgotPasswordResetReqDto {
  @ApiProperty({ description: "One-time reset token returned from OTP verification" })
  @IsString()
  resetToken: string;

  @ApiProperty({ minLength: 8, example: "Secret@123", description: "New password (minimum 8 characters)" })
  @IsString()
  @MinLength(8)
  password: string;
}
