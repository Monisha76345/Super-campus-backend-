import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ProfileVisibility } from "../../entity/enums/profile-visibility.enum";

export class ExperienceItemReqDto {
  @ApiProperty({ example: "Campus Lab" })
  @IsString()
  @MaxLength(120)
  employer: string;

  @ApiProperty({ example: "Intern" })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: "2025-06-01" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: "2025-08-01" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;
}
