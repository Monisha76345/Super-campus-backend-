import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateClubAchievementDto {
  @ApiProperty({ description: "Achievement title", example: "National Collegiate Champion" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Short description / summary", example: "Won 1st prize in All-India Robotics Cup" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Badge text", example: "1st Place 🏆" })
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional({ description: "Date or year", example: "2026" })
  @IsOptional()
  @IsString()
  date?: string;
}

export class CreateClubReqDto {
  @ApiProperty({ description: "Club name", example: "Google Developer Student Club" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: "Category", example: "Technical" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category: string;

  @ApiProperty({ description: "Description", example: "Club for software developers, AI enthusiasts, and competitive programmers." })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: "Detailed club overview, mission, and activities" })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ description: "Initial club achievements and accolades (text or list)" })
  @IsOptional()
  achievements?: CreateClubAchievementDto[] | string;

  @ApiPropertyOptional({ description: "Lead person full name", example: "Aryan Deshmukh" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  leadName?: string;

  @ApiPropertyOptional({ description: "Meeting schedule", example: "Wednesdays & Saturdays · 5:00 PM" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meetingSchedule?: string;

  @ApiPropertyOptional({ description: "Room or venue", example: "CS Seminar Hall 2, Block 2" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  roomOrVenue?: string;

  @ApiPropertyOptional({ description: "Official contact email", example: "gdsc@nmit.ac.in" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({ description: "Banner key or identifier", example: "gdsc-banner" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bannerKey?: string;
}
