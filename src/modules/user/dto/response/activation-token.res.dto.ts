import { ApiProperty } from "@nestjs/swagger";

export class ActivationTokenResDto {
  @ApiProperty()
  activationToken: string;
}
