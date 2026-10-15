import { ApiProperty } from "@nestjs/swagger";

export class DirectoryResDto {
  @ApiProperty()
  usn: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  collegeEmail: string;

  @ApiProperty({ nullable: true })
  mobile: string | null;

  @ApiProperty({ example: "STUDENT" })
  role: string;

  @ApiProperty()
  isHostelite: boolean;

  @ApiProperty({ example: "pending" })
  status: string;
}
