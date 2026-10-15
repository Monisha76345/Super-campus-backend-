import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ActivateOtpReqDto {
  @ApiProperty({ example: "1nt21cs001@nmit.ac.in" })
  @IsEmail()
  email: string;
}
