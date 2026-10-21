import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { ChatRepository } from "../repository/chat.repository";
import { ChatThread } from "../entity/chat-thread.model";
import { ChatParticipant } from "../entity/chat-participant.model";
import { ChatMessage } from "../entity/chat-message.model";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";
import { UserAccount } from "src/modules/user/entity/user.model";

@Injectable()
export class ChatDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<ChatRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new ChatRepository(manager);
  }

  async saveThread(namespace: string, row: ChatThread): Promise<ChatThread> {
    return (await this.repo(namespace)).saveThread(row);
  }

  async findThreadById(namespace: string, id: string): Promise<ChatThread | null> {
    return (await this.repo(namespace)).findThreadById(id);
  }

  async findDirectThreadBetween(namespace: string, userA: string, userB: string): Promise<ChatThread | null> {
    return (await this.repo(namespace)).findDirectThreadBetween(userA, userB);
  }

  async saveParticipant(namespace: string, row: ChatParticipant): Promise<ChatParticipant> {
    return (await this.repo(namespace)).saveParticipant(row);
  }

  async saveMessage(namespace: string, row: ChatMessage): Promise<ChatMessage> {
    return (await this.repo(namespace)).saveMessage(row);
  }

  async findThreadsForUser(namespace: string, userId: string): Promise<ChatThread[]> {
    return (await this.repo(namespace)).findThreadsForUser(userId);
  }

  async findMessagesForThread(namespace: string, threadId: string): Promise<ChatMessage[]> {
    return (await this.repo(namespace)).findMessagesForThread(threadId);
  }

  async markParticipantRead(namespace: string, threadId: string, userId: string): Promise<void> {
    return (await this.repo(namespace)).markParticipantRead(threadId, userId);
  }

  async getParticipants(namespace: string, threadId: string): Promise<ChatParticipant[]> {
    return (await this.repo(namespace)).getParticipants(threadId);
  }

  async findDirectoryUserById(namespace: string, userId: string): Promise<{ directory: CampusDirectory; user: UserAccount; photoKey: string | null } | null> {
    return (await this.repo(namespace)).findDirectoryUserById(userId);
  }

  async findDirectoryUsersByUserIds(namespace: string, userIds: string[]): Promise<Map<string, { directory: CampusDirectory; photoKey: string | null }>> {
    return (await this.repo(namespace)).findDirectoryUsersByUserIds(userIds);
  }

  async searchDirectoryUsers(
    namespace: string,
    query: string,
    excludeUserId: string,
  ): Promise<Array<{ user: UserAccount; directory: CampusDirectory; photoKey: string | null }>> {
    return (await this.repo(namespace)).searchDirectoryUsers(query, excludeUserId);
  }
}
