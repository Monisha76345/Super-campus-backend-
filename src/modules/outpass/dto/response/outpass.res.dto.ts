import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OutpassStatus } from "../../entity/enums/outpass-status.enum";
import { PassType } from "../../entity/enums/pass-type.enum";

export class OutpassResDto {
  @ApiProperty({ example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })
  id: string;

  @ApiProperty({ example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })
  studentId: string;

  @ApiPropertyOptional({ example: "Druva N" })
  studentName: string | null;

  @ApiPropertyOptional({ example: "1NT21CS001" })
  usn: string | null;

  @ApiPropertyOptional({ example: "B-204" })
  roomNumber: string | null;

  @ApiPropertyOptional({ example: "+919876543210" })
  parentPhone: string | null;

  @ApiProperty({ enum: PassType, example: PassType.OUTPASS })
  passType: PassType;

  @ApiProperty({ example: "Home visit" })
  destination: string;

  @ApiProperty({ example: "Attending sister's marriage" })
  reason: string;

  @ApiProperty({ example: "2026-10-17T09:25:00.000Z" })
  departureTime: string;

  @ApiProperty({ example: "2026-10-31T09:25:00.000Z" })
  returnTime: string;

  @ApiProperty({ enum: OutpassStatus, example: OutpassStatus.PENDING })
  status: OutpassStatus;

  @ApiPropertyOptional({ example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })
  reviewedBy: string | null;

  @ApiPropertyOptional({ example: "2026-10-17T10:00:00.000Z" })
  reviewedAt: string | null;

  @ApiPropertyOptional({ example: "Exam period active" })
  rejectionReason: string | null;

  @ApiPropertyOptional({ example: "2026-10-17T09:30:00.000Z" })
  actualExitTime: string | null;

  @ApiPropertyOptional({ example: "2026-10-31T09:15:00.000Z" })
  actualEntryTime: string | null;

  @ApiPropertyOptional({ example: "outpass-token-xyz-123" })
  qrToken: string | null;

  @ApiProperty({ example: "2026-10-17T09:24:00.000Z" })
  createdAt: string;

  @ApiProperty({ example: "2026-10-17T09:24:00.000Z" })
  updatedAt: string;
}
