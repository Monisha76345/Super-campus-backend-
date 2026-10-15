import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class LoginReqDto {
  @ApiProperty({
    example: "1nt22ad015.druva@nmit.ac.in",
    description: "College email for student, faculty, and admin. Alumni use their USN.",
  })
  @IsString()
  @MinLength(3)
  email: string;

  @ApiProperty({ example: "campus2026" })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ example: "nmit", description: "Campus code. Defaults to DEFAULT_TENANT_ID." })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
