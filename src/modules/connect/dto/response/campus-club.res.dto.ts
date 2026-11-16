import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ClubMemberItemDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  clubRole: string;

  @ApiProperty()
  department: string;

  @ApiPropertyOptional()
  batch?: string;

  @ApiPropertyOptional()
  usn?: string | null;

  @ApiProperty()
  initials: string;

  @ApiProperty()
  isLead: boolean;
}

export class CampusClubResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ nullable: true })
  leadUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  leadName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  meetingSchedule?: string | null;

  @ApiPropertyOptional({ nullable: true })
  roomOrVenue?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactEmail?: string | null;

  @ApiProperty()
  memberCount: number;

  @ApiPropertyOptional({ nullable: true })
  bannerKey: string | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ default: false })
  isJoined?: boolean;

  @ApiPropertyOptional({ type: [ClubMemberItemDto] })
  members?: ClubMemberItemDto[];
}
