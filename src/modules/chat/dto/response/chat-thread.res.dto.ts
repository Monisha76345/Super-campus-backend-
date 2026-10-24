import { ApiProperty } from "@nestjs/swagger";
import { ChatThreadType } from "../../entity/enums/chat-thread-type.enum";

export class ParticipantSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  usn: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  initials: string;

  @ApiProperty({ nullable: true })
  department: string | null;

  @ApiProperty({ nullable: true })
  photoKey?: string | null;
}

export class ChatThreadResDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ChatThreadType })
  type: ChatThreadType;

  @ApiProperty({ nullable: true })
  name?: string | null;

  @ApiProperty({ nullable: true })
  photoKey?: string | null;

  @ApiProperty({ type: ParticipantSummaryDto })
  recipient: ParticipantSummaryDto;

  @ApiProperty({ nullable: true })
  participantsCount?: number;

  @ApiProperty({ type: [ParticipantSummaryDto], required: false })
  participants?: ParticipantSummaryDto[];

  @ApiProperty({ nullable: true })
  lastMessageText: string | null;

  @ApiProperty({ nullable: true })
  lastMessageAt: string | null;

  @ApiProperty({ nullable: true })
  formattedDate: string | null;

  @ApiProperty()
  unreadCount: number;
}
