import { ApiProperty } from "@nestjs/swagger";
import { OpportunityType } from "../../entity/enums/opportunity-type.enum";

export class CampusOpportunityResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  company: string;

  @ApiProperty({ enum: OpportunityType })
  type: OpportunityType;

  @ApiProperty()
  location: string;

  @ApiProperty({ nullable: true })
  stipendOrSalary: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  applyUrl: string | null;

  @ApiProperty({ nullable: true })
  deadline: string | null;

  @ApiProperty({ description: "User ID of the poster/recruiter" })
  createdBy: string;

  @ApiProperty({ nullable: true, description: "Name of the recruiter or poster" })
  creatorName?: string | null;

  @ApiProperty({ nullable: true, description: "Role of the recruiter or poster" })
  creatorRole?: string | null;

  @ApiProperty({ nullable: true, description: "Photo key of the recruiter or poster" })
  creatorPhotoKey?: string | null;

  @ApiProperty({ nullable: true, description: "Contact email of the recruiter or poster" })
  creatorEmail?: string | null;
}
