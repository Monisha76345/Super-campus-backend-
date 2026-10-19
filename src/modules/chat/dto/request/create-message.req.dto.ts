import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateMessageReqDto {
  @ApiProperty({ description: "Message content (up to 2000 characters)", example: "Hello! Are you at the lab?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
