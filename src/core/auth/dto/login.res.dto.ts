import { ApiProperty } from "@nestjs/swagger";

export class LoginResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ example: "student" })
  role: string;

  @ApiProperty()
  token: string;

  @ApiProperty({ example: "nmit" })
  tenantId: string;

  @ApiProperty({ example: "NMIT Bengaluru" })
  campusName: string;

  @ApiProperty({ description: "True when this student lives in the hostel. Outpass and mess apply only then." })
  hostelite: boolean;

  @ApiProperty()
  changePasswordRequired: boolean;
}
