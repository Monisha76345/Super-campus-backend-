import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ProjectCategory } from "../../entity/enums/project-category.enum";
import { ProjectStatus } from "../../entity/enums/project-status.enum";

export class ProjectQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus, description: "Filter by status (OPEN, ACTIVE, COMPLETED, ARCHIVED)" })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectCategory, description: "Filter by category" })
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @ApiPropertyOptional({ description: "Search query for title, description, or skills" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Show only projects created by logged-in user" })
  @IsOptional()
  @IsString()
  mine?: string;
}
