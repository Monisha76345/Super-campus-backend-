import { ApiProperty } from "@nestjs/swagger";

export class IncomingConnectionResDto {
  @ApiProperty()
  connectionId: string;

  @ApiProperty()
  requesterUserId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty({ nullable: true })
  batch: string | null;

  @ApiProperty({ nullable: true })
  program: string | null;

  @ApiProperty()
  initials: string;

  @ApiProperty()
  handle: string;

  @ApiProperty({ nullable: true })
  photoKey: string | null;

  @ApiProperty()
  createdAt: string;
}
