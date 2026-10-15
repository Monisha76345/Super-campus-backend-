import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class SetHosteliteReqDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isHostelite: boolean;
}
