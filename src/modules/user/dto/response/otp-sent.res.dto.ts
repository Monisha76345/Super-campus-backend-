import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OtpSentResDto {
  @ApiProperty({ example: "1nt21cs001@nmit.ac.in" })
  destination: string;

  @ApiPropertyOptional({
    description: "Present only when SMTP is not configured and NODE_ENV is not production.",
  })
  debugOtp?: string;
}
