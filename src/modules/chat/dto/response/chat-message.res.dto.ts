import { ApiProperty } from "@nestjs/swagger";
import { ChatMessageStatus } from "../../entity/enums/chat-message-status.enum";

export class ChatMessageResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  threadId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  senderName: string;

  @ApiProperty()
  senderUsn: string | null;

  @ApiProperty({ nullable: true })
  senderPhotoKey?: string | null;

  @ApiProperty({ nullable: true })
  senderInitials?: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ChatMessageStatus })
  status: ChatMessageStatus;

  @ApiProperty()
  isMine: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  formattedTime: string;
}
