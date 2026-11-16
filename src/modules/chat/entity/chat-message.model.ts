import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ChatMessageStatus } from "./enums/chat-message-status.enum";
import { ChatThread } from "./chat-thread.model";

@Entity({ name: "chat_message" })
export class ChatMessage extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  threadId: string;

  @Column({ type: "varchar", length: 36 })
  senderId: string;

  @Column({ type: "varchar", length: 2000, default: "" })
  content: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  mediaUrl: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  mediaType: string | null;

  @Column({
    type: "enum",
    enum: ChatMessageStatus,
    default: ChatMessageStatus.SENT,
  })
  status: ChatMessageStatus;

  @ManyToOne(() => ChatThread, (thread) => thread.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "threadId" })
  thread: ChatThread;
}
