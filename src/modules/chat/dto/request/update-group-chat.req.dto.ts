import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateGroupChatReqDto {
  @ApiProperty({ description: "New group name", required: false, example: "Updated Study Group" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: "User IDs to add to the group",
    required: false,
    example: ["22222222-2222-4222-8222-222222222222"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addMemberUserIds?: string[];

  @ApiProperty({ description: "User ID to remove from group", required: false })
  @IsOptional()
  @IsString()
  removeUserId?: string;
}
