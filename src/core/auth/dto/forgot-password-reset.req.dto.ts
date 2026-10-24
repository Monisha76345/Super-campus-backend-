import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ForgotPasswordResetReqDto {
  @ApiProperty({ description: "Reset token received after OTP verification" })
  @IsNotEmpty()
  @IsString()
  resetToken: string;

  @ApiProperty({ example: "NewSecurePassword123", description: "New password (min 6 characters)" })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
