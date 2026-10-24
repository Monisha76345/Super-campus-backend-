import { ApiProperty } from "@nestjs/swagger";

export class ResetTokenResDto {
  @ApiProperty({ description: "One-time token used to reset the password" })
  resetToken: string;
}
