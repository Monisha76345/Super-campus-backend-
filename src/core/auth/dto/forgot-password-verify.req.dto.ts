import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class ForgotPasswordVerifyReqDto {
  @ApiProperty({ example: "1nt21cs001@nmit.ac.in", description: "Registered college email" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456", description: "6-digit OTP code" })
  @IsString()
  @Length(6, 6)
  otp: string;
}
