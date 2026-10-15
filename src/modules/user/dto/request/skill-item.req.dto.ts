import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class SkillItemReqDto {
  @ApiProperty({ example: "React" })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;
}
