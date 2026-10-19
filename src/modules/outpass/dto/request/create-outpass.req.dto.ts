import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateOutpassReqDto {
  @ApiProperty({ description: "Destination location", example: "Home visit" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destination: string;

  @ApiProperty({ description: "Reason for leaving campus", example: "Attending sister's marriage" })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: "Planned departure timestamp", example: "2026-10-17T09:25:00.000Z" })
  @IsDateString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty({ description: "Planned return timestamp", example: "2026-10-31T09:25:00.000Z" })
  @IsDateString()
  @IsNotEmpty()
  returnTime: string;

  @ApiPropertyOptional({ description: "Hostel room number", example: "B-204" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  roomNumber?: string;

  @ApiPropertyOptional({ description: "Parent phone number for SMS notifications on gate exit and entry", example: "+919876543210" })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  parentPhone?: string;
}
