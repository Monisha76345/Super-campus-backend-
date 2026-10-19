import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OutpassStatus } from "../../entity/enums/outpass-status.enum";

export class UpdateOutpassStatusReqDto {
  @ApiProperty({
    description: "New status for the outpass",
    enum: [OutpassStatus.APPROVED, OutpassStatus.REJECTED],
    example: OutpassStatus.APPROVED,
  })
  @IsEnum(OutpassStatus)
  @IsNotEmpty()
  status: OutpassStatus;

  @ApiPropertyOptional({
    description: "Reason if the request is rejected",
    example: "Exam period active, leaves not permitted.",
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
