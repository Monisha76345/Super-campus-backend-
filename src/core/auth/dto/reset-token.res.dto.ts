import { ApiProperty } from "@nestjs/swagger";

export class ResetTokenResDto {
  @ApiProperty({ description: "One-time token used to set a new password" })
  resetToken: string;
}
