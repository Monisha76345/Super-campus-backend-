import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateGroupChatReqDto {
  @ApiProperty({ description: "Group name / title", example: "Study Group CSE" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "Optional group profile photo key or URL", required: false })
  @IsString()
  @IsOptional()
  photoKey?: string;

  @ApiProperty({
    description: "Array of participant User IDs to add to the group",
    example: ["22222222-2222-4222-8222-222222222222"],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberUserIds: string[];
}
