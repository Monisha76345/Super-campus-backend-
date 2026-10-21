import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { ChatDataService } from "./chat-data.service";
import { ChatThread } from "../entity/chat-thread.model";
import { ChatParticipant } from "../entity/chat-participant.model";
import { ChatMessage } from "../entity/chat-message.model";
import { ChatThreadType } from "../entity/enums/chat-thread-type.enum";
import { ChatMessageStatus } from "../entity/enums/chat-message-status.enum";
import { ChatThreadResDto, ParticipantSummaryDto } from "../dto/response/chat-thread.res.dto";
import { ChatMessageResDto } from "../dto/response/chat-message.res.dto";
import { SearchUserResDto } from "../dto/response/search-user.res.dto";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";

@Injectable()
export class ChatService {
  constructor(
    private readonly data: ChatDataService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private get namespace(): string {
    return this.tenantContext.getTenantId();
  }

  private initials(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private formatDate(date: Date | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isSameDay) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  private formatTime(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  }

  async getThreads(userId: string): Promise<ChatThreadResDto[]> {
    const threads = await this.data.findThreadsForUser(this.namespace, userId);
    // Only return threads that have at least one message sent
    const activeThreads = threads.filter(
      (t) => t.lastMessageText && t.lastMessageText.trim().length > 0,
    );
    if (!activeThreads.length) return [];

    // Collect all recipient user IDs
    const otherUserIds = new Set<string>();
    activeThreads.forEach((t) => {
      const other = t.participants?.find((p) => p.userId !== userId);
      if (other) otherUserIds.add(other.userId);
    });

    const dirMap = await this.data.findDirectoryUsersByUserIds(this.namespace, Array.from(otherUserIds));

    return activeThreads.map((thread) => {
      const otherParticipant = thread.participants?.find((p) => p.userId !== userId);
      const otherUserId = otherParticipant?.userId || "";
      const info = dirMap.get(otherUserId);
      const dir = info?.directory;

      const recipient: ParticipantSummaryDto = {
        userId: otherUserId,
        fullName: dir?.fullName || "Campus Member",
        usn: dir?.usn || null,
        role: dir?.role || "STUDENT",
        initials: this.initials(dir?.fullName || "Campus Member"),
        department: dir?.department || null,
        photoKey: info?.photoKey || null,
      };

      return {
        id: thread.id,
        type: thread.type,
        recipient,
        lastMessageText: thread.lastMessageText || null,
        lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt).toISOString() : null,
        formattedDate: this.formatDate(thread.lastMessageAt || thread.createdAt),
        unreadCount: 0,
      };
    });
  }

  async getMessages(userId: string, threadId: string): Promise<ChatMessageResDto[]> {
    const participants = await this.data.getParticipants(this.namespace, threadId);
    const isMember = participants.some((p) => p.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }

    // Mark as read
    await this.data.markParticipantRead(this.namespace, threadId, userId);

    const messages = await this.data.findMessagesForThread(this.namespace, threadId);
    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
    const dirMap = await this.data.findDirectoryUsersByUserIds(this.namespace, senderIds);

    return messages.map((m) => {
      const info = dirMap.get(m.senderId);
      const dir = info?.directory;
      return {
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        senderName: dir?.fullName || "Member",
        senderUsn: dir?.usn || null,
        content: m.content,
        status: m.status,
        isMine: m.senderId === userId,
        createdAt: new Date(m.createdAt).toISOString(),
        formattedTime: this.formatTime(m.createdAt),
      };
    });
  }

  async startDirectChat(userId: string, recipientUserId: string): Promise<ChatThreadResDto> {
    if (userId === recipientUserId) {
      throw new BadRequestException("You cannot start a chat with yourself");
    }

    // Verify recipient exists
    const recipientUser = await this.data.findDirectoryUserById(this.namespace, recipientUserId);
    if (!recipientUser) {
      throw new NotFoundException("Recipient user not found on this campus");
    }

    // Check if a direct thread already exists
    let thread = await this.data.findDirectThreadBetween(this.namespace, userId, recipientUserId);
    if (!thread) {
      const threadId = randomUUID();
      thread = new ChatThread();
      thread.id = threadId;
      thread.type = ChatThreadType.DIRECT;
      thread.lastMessageText = null;
      thread.lastMessageAt = null;
      thread.lastSenderId = null;
      thread.createdBy = userId;
      thread.updatedBy = userId;
      await this.data.saveThread(this.namespace, thread);

      const p1 = new ChatParticipant();
      p1.id = randomUUID();
      p1.threadId = threadId;
      p1.userId = userId;
      p1.createdBy = userId;
      p1.updatedBy = userId;
      await this.data.saveParticipant(this.namespace, p1);

      const p2 = new ChatParticipant();
      p2.id = randomUUID();
      p2.threadId = threadId;
      p2.userId = recipientUserId;
      p2.createdBy = userId;
      p2.updatedBy = userId;
      await this.data.saveParticipant(this.namespace, p2);
    }

    const dir = recipientUser.directory;
    const recipient: ParticipantSummaryDto = {
      userId: recipientUserId,
      fullName: dir.fullName,
      usn: dir.usn,
      role: dir.role,
      initials: this.initials(dir.fullName),
      department: dir.department,
      photoKey: recipientUser.photoKey || null,
    };

    return {
      id: thread.id,
      type: thread.type,
      recipient,
      lastMessageText: thread.lastMessageText,
      lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt).toISOString() : null,
      formattedDate: this.formatDate(thread.lastMessageAt || thread.createdAt),
      unreadCount: 0,
    };
  }

  async sendMessage(userId: string, threadId: string, content: string): Promise<ChatMessageResDto> {
    const cleanContent = content.trim();
    if (!cleanContent) {
      throw new BadRequestException("Message content cannot be empty");
    }

    const participants = await this.data.getParticipants(this.namespace, threadId);
    const isMember = participants.some((p) => p.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }

    const thread = await this.data.findThreadById(this.namespace, threadId);
    if (!thread) {
      throw new NotFoundException("Conversation thread not found");
    }

    const message = new ChatMessage();
    message.id = randomUUID();
    message.threadId = threadId;
    message.senderId = userId;
    message.content = cleanContent;
    message.status = ChatMessageStatus.SENT;
    message.createdBy = userId;
    message.updatedBy = userId;
    const savedMsg = await this.data.saveMessage(this.namespace, message);

    // Update thread summary
    thread.lastMessageText = cleanContent.slice(0, 480);
    thread.lastMessageAt = new Date();
    thread.lastSenderId = userId;
    thread.updatedBy = userId;
    await this.data.saveThread(this.namespace, thread);

    const userProfile = await this.data.findDirectoryUserById(this.namespace, userId);

    return {
      id: savedMsg.id,
      threadId: savedMsg.threadId,
      senderId: savedMsg.senderId,
      senderName: userProfile?.directory.fullName || "Me",
      senderUsn: userProfile?.directory.usn || null,
      content: savedMsg.content,
      status: savedMsg.status,
      isMine: true,
      createdAt: new Date(savedMsg.createdAt).toISOString(),
      formattedTime: this.formatTime(savedMsg.createdAt),
    };
  }

  async searchUsers(userId: string, query: string): Promise<SearchUserResDto[]> {
    const list = await this.data.searchDirectoryUsers(this.namespace, query, userId);
    return list.map(({ user, directory, photoKey }) => ({
      userId: user.id,
      fullName: directory.fullName,
      usn: directory.usn,
      collegeEmail: directory.collegeEmail,
      role: directory.role,
      department: directory.department,
      initials: this.initials(directory.fullName),
      photoKey: photoKey || null,
    }));
  }
}
