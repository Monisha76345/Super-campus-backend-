import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional } from "class-validator";

export class ConvertAlumniReqDto {
  @ApiPropertyOptional({ example: "asha@gmail.com" })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;
}
