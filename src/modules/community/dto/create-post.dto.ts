import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { PostVisibility } from "../entity/community-post.model";

export class CreatePostDto {
  @ApiProperty({ description: "Post content text", maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: "Array of image/video URLs", type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({ enum: PostVisibility, default: PostVisibility.CAMPUS })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;
}
