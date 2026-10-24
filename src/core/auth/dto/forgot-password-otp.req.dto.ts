import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordOtpReqDto {
  @ApiProperty({ example: "1nt21cs001@nmit.ac.in", description: "Registered college email" })
  @IsEmail()
  email: string;
}
