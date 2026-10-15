import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProfileVisibility } from "../../entity/enums/profile-visibility.enum";
import { ResidencyStatus } from "../../entity/enums/residency-status.enum";
import { EducationItem, ExperienceItem, SkillItem } from "../../entity/profile-items";

export class ProfileResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  usn: string;

  @ApiProperty()
  collegeEmail: string;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional({ nullable: true })
  department: string | null;

  @ApiPropertyOptional({ nullable: true })
  batch: string | null;

  @ApiPropertyOptional({ nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ nullable: true })
  handle: string | null;

  @ApiPropertyOptional({ nullable: true })
  graduationYear: number | null;

  @ApiProperty({ enum: ProfileVisibility })
  visibility: ProfileVisibility;

  @ApiProperty({ enum: ResidencyStatus })
  residency: ResidencyStatus;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ nullable: true })
  photoDocumentId: number | null;

  @ApiPropertyOptional({ nullable: true })
  photoKey: string | null;

  @ApiProperty({ type: "array" })
  education: EducationItem[];

  @ApiProperty({ type: "array" })
  experience: ExperienceItem[];

  @ApiProperty({ type: "array" })
  skills: SkillItem[];
}
