import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ProjectCategory } from "../../entity/enums/project-category.enum";
import { ProjectStage } from "../../entity/enums/project-stage.enum";
import { ProjectSupportType } from "../../entity/enums/project-support-type.enum";
import { ProjectVisibility } from "../../entity/enums/project-visibility.enum";

export class ProjectSupportReqDto {
  @ApiProperty({ enum: ProjectSupportType })
  @IsEnum(ProjectSupportType)
  serviceType: ProjectSupportType;

  @ApiPropertyOptional({ example: "Frontend Dev, UI Designer" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rolesNeeded?: string;

  @ApiPropertyOptional({ example: "2 - 4" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numberOfStudents?: string;

  @ApiPropertyOptional({ example: "Part-time" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  commitment?: string;

  @ApiPropertyOptional({ example: "React Native, TypeScript" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  preferredSkills?: string;

  @ApiPropertyOptional({ example: "AI/ML Expert" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  mentorDomain?: string;

  @ApiPropertyOptional({ example: "Grant for cloud hosting" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fundingDetails?: string;
}

export class CreateProjectReqDto {
  @ApiProperty({ example: "Campus Navigator", maxLength: 140 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(140)
  title: string;

  @ApiProperty({ example: "A mobile map application for freshers", maxLength: 200 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  shortDescription: string;

  @ApiPropertyOptional({ example: "Detailed problem statement and system goals..." })
  @IsOptional()
  @IsString()
  moreDetails?: string;

  @ApiProperty({ enum: ProjectCategory, example: ProjectCategory.ACADEMIC })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiProperty({ enum: ProjectStage, example: ProjectStage.IDEA })
  @IsEnum(ProjectStage)
  stage: ProjectStage;

  @ApiPropertyOptional({ example: "3 - 6 Months" })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: "NMIT North Campus" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    enum: ProjectVisibility,
    default: ProjectVisibility.CAMPUS_ONLY,
    example: ProjectVisibility.CAMPUS_ONLY,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ApiPropertyOptional({ type: [String], example: ["React Native", "TypeScript", "Node.js"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ type: [ProjectSupportReqDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectSupportReqDto)
  @IsOptional()
  supportNeeds?: ProjectSupportReqDto[];

  @ApiPropertyOptional({ example: "https://example.com/banner.png" })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pdfDocument?: any;
}
