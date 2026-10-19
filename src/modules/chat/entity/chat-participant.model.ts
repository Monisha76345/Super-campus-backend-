import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";
import { ChatThread } from "./chat-thread.model";

@Entity({ name: "chat_participant" })
export class ChatParticipant extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 36 })
  threadId: string;

  @Column({ type: "varchar", length: 36 })
  userId: string;

  @Column({ type: "datetime", precision: 6, nullable: true })
  lastReadAt: Date | null;

  @ManyToOne(() => ChatThread, (thread) => thread.participants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "threadId" })
  thread: ChatThread;
}
