import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class UpdateThemeReqDto {
  @ApiProperty({
    description: "User preferred UI theme",
    example: "dark",
    enum: ["dark", "light", "system"],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(["dark", "light", "system"])
  theme: string;
}
