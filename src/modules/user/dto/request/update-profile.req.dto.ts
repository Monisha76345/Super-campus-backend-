import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { ProfileVisibility } from "../../entity/enums/profile-visibility.enum";
import { ResidencyStatus } from "../../entity/enums/residency-status.enum";

export class UpdateProfileReqDto {
  @ApiPropertyOptional({ example: "Druva" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: "N" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: "druva_nmit" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  handle?: string;

  @ApiPropertyOptional({ example: 2027 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  graduationYear?: number;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @ApiPropertyOptional({ enum: ResidencyStatus })
  @IsOptional()
  @IsEnum(ResidencyStatus)
  residency?: ResidencyStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: "Computer Science & Engineering" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional({ example: "2025" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  batch?: string;

  @ApiPropertyOptional({ example: "1MS21CS045" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  usn?: string;

  @ApiPropertyOptional({ example: "student@campus.edu" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  collegeEmail?: string;
}
