import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ChatThreadType } from "./enums/chat-thread-type.enum";
import { ChatParticipant } from "./chat-participant.model";
import { ChatMessage } from "./chat-message.model";

@Entity({ name: "chat_thread" })
export class ChatThread extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({
    type: "enum",
    enum: ChatThreadType,
    default: ChatThreadType.DIRECT,
  })
  type: ChatThreadType;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  photoKey: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  lastMessageText: string | null;

  @Column({ type: "datetime", precision: 6, nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  lastSenderId: string | null;

  @OneToMany(() => ChatParticipant, (participant) => participant.thread)
  participants: ChatParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.thread)
  messages: ChatMessage[];
}
