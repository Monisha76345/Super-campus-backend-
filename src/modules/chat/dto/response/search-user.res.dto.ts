import { ApiProperty } from "@nestjs/swagger";

export class SearchUserResDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  usn: string;

  @ApiProperty()
  collegeEmail: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty()
  initials: string;
}
