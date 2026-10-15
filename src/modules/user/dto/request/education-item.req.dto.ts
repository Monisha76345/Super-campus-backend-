import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ProfileVisibility } from "../../entity/enums/profile-visibility.enum";

export class EducationItemReqDto {
  @ApiProperty({ example: "NMIT" })
  @IsString()
  @MaxLength(120)
  school: string;

  @ApiProperty({ example: "B.E. Artificial Intelligence" })
  @IsString()
  @MaxLength(120)
  degree: string;

  @ApiPropertyOptional({ example: "2022-08-01" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: "2026-06-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;
}
