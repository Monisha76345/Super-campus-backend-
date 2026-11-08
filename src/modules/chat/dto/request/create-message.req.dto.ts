import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateMessageReqDto {
  @ApiProperty({ description: "Message content (up to 2000 characters)", example: "Hello! Are you at the lab?", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

  @ApiProperty({ description: "Optional media URL for image/video attachments", required: false })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ description: "Attachment media type: IMAGE or VIDEO", required: false })
  @IsString()
  @IsOptional()
  mediaType?: string;
}
