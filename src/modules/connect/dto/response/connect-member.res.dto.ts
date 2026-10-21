import { ApiProperty } from "@nestjs/swagger";

export class ConnectMemberResDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  batch: string | null;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty()
  initials: string;

  @ApiProperty({ nullable: true })
  photoKey: string | null;

  @ApiProperty({ nullable: true })
  usn: string | null;

  @ApiProperty({ nullable: true })
  program: string | null;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty()
  handle: string;

  @ApiProperty({ nullable: true })
  connectionId?: string | null;

  @ApiProperty({ default: "NONE" })
  connectionStatus: "NONE" | "PENDING" | "INCOMING_REQUEST" | "ACCEPTED";
}
