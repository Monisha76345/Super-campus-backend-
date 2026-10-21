import { ApiProperty } from "@nestjs/swagger";

export class CampusClubResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ nullable: true })
  bannerKey: string | null;

  @ApiProperty()
  status: string;
}
