import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class ActivateVerifyReqDto {
  @ApiProperty({ example: "1nt21cs001@nmit.ac.in" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  otp: string;
}
