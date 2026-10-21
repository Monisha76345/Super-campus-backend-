import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateEventReqDto {
  @ApiProperty({ description: "Title of the campus event" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Event description and participation details" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: "Venue / Hall / Auditorium / Link" })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({ description: "Start time (yyyy-MM-dd HH:mm or ISO)" })
  @IsString()
  @IsNotEmpty()
  startsAt: string;

  @ApiProperty({ description: "End time (yyyy-MM-dd HH:mm or ISO)" })
  @IsString()
  @IsNotEmpty()
  endsAt: string;

  @ApiPropertyOptional({ description: "Maximum capacity (optional)" })
  @IsNumber()
  @IsOptional()
  capacity?: number;
}
