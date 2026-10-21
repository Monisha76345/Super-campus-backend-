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
}
