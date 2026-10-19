import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class StartDirectChatReqDto {
  @ApiProperty({ description: "Target participant User ID or Directory ID to chat with", example: "22222222-2222-4222-8222-222222222222" })
  @IsString()
  @IsNotEmpty()
  recipientUserId: string;
}
