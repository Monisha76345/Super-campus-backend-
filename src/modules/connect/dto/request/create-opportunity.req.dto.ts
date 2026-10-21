import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OpportunityType } from "../../entity/enums/opportunity-type.enum";

export class CreateOpportunityReqDto {
  @ApiProperty({ description: "Position title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Company / organization" })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ enum: OpportunityType, description: "INTERNSHIP or JOB" })
  @IsEnum(OpportunityType)
  @IsNotEmpty()
  type: OpportunityType;

  @ApiProperty({ description: "Location / remote" })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: "Responsibilities and full position details" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: "Skills, eligibility and duration" })
  @IsString()
  @IsOptional()
  skillsAndEligibility?: string;

  @ApiPropertyOptional({ description: "Salary / stipend (or explicitly unpaid)" })
  @IsString()
  @IsOptional()
  stipendOrSalary?: string;

  @ApiPropertyOptional({ description: "Apply before (yyyy-MM-dd HH:mm or ISO)" })
  @IsString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ description: "Direct application link / email" })
  @IsString()
  @IsOptional()
  applyUrl?: string;
}
