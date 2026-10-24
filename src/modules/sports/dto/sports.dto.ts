import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { SportType } from "../entity/enums/sport-type.enum";
import { VenueType } from "../entity/enums/venue-type.enum";

export class QueryFacilitiesDto {
  @ApiPropertyOptional({ enum: SportType })
  @IsOptional()
  @IsString()
  sportType?: string;

  @ApiPropertyOptional({ enum: VenueType })
  @IsOptional()
  @IsString()
  venueType?: string;

  @ApiPropertyOptional({ description: "Search by court or venue name" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QuerySlotsDto {
  @ApiProperty({ example: "2026-10-24", description: "Date in YYYY-MM-DD" })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be in YYYY-MM-DD format" })
  date: string;
}

export class TeammateInputDto {
  @ApiProperty({ example: "usr-123" })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: "Aarav Patel" })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiPropertyOptional({ example: "1NT22CS089" })
  @IsOptional()
  @IsString()
  userUsn?: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: "fac-badminton-1" })
  @IsNotEmpty()
  @IsString()
  facilityId: string;

  @ApiProperty({ example: "2026-10-24" })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "bookingDate must be in YYYY-MM-DD format" })
  bookingDate: string;

  @ApiProperty({ example: "18:00:00", description: "Start time HH:MM or HH:MM:SS" })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ example: "19:00:00" })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: false, description: "Whether to list in Open Games" })
  @IsOptional()
  isOpenGame?: boolean;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(22)
  maxPlayers?: number;

  @ApiPropertyOptional({ example: "Need 2 more for doubles" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ type: [TeammateInputDto], description: "Selected teammates to add during booking" })
  @IsOptional()
  teammates?: TeammateInputDto[];
}

export class JoinWithCodeDto {
  @ApiProperty({ example: "BADM-4821", description: "6 to 12 alphanumeric code" })
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}

export class AddTeammateDto {
  @ApiProperty({ example: "usr-1234" })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: "Aarav Patel" })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiPropertyOptional({ example: "1NT22CS089" })
  @IsOptional()
  @IsString()
  userUsn?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: "Class schedule clash" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class CreateFacilityDto {
  @ApiProperty({ example: "Badminton Court 3" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: SportType, default: SportType.BADMINTON })
  @IsNotEmpty()
  @IsEnum(SportType)
  sportType: SportType;

  @ApiProperty({ enum: VenueType, default: VenueType.INDOOR })
  @IsNotEmpty()
  @IsEnum(VenueType)
  venueType: VenueType;

  @ApiProperty({ example: "Indoor Sports Complex · Floor 1" })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: "Championship maple wood court" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Non-marking shoes only" })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional({ example: "06:00:00" })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({ example: "22:00:00" })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  maxPlayers?: number;
}
