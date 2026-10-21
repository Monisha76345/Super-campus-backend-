import { ApiProperty } from "@nestjs/swagger";
import { EventStatus } from "../../entity/enums/event-status.enum";

export class CampusEventResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  startsAt: string;

  @ApiProperty()
  endsAt: string;

  @ApiProperty({ nullable: true })
  capacity: number | null;

  @ApiProperty()
  registeredCount: number;

  @ApiProperty({ nullable: true })
  bannerKey: string | null;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  formattedDate: string;

  @ApiProperty()
  formattedTime: string;

  @ApiProperty()
  createdBy: string;
}
