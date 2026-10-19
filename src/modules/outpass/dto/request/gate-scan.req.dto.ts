import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GateScanReqDto {
  @ApiProperty({
    description: "QR code token or outpass ID presented by the student",
    example: "outpass-token-verified-8891",
  })
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @ApiPropertyOptional({
    description: "Optional explicit scan type: 'EXIT' or 'ENTRY'. Auto-detected if omitted.",
    enum: ["EXIT", "ENTRY"],
    example: "EXIT",
  })
  @IsOptional()
  @IsEnum(["EXIT", "ENTRY"])
  scanType?: "EXIT" | "ENTRY";
}
