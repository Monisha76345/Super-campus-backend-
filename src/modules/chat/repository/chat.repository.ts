import { EntityManager, In } from "typeorm";
import { ChatThread } from "../entity/chat-thread.model";
import { ChatParticipant } from "../entity/chat-participant.model";
import { ChatMessage } from "../entity/chat-message.model";
import { ChatThreadType } from "../entity/enums/chat-thread-type.enum";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";
import { UserAccount } from "src/modules/user/entity/user.model";

export class ChatRepository {
  constructor(private readonly manager: EntityManager) {}

  async saveThread(thread: ChatThread): Promise<ChatThread> {
    return this.manager.getRepository(ChatThread).save(thread);
  }

  async findThreadById(id: string): Promise<ChatThread | null> {
    return this.manager.getRepository(ChatThread).findOne({
      where: { id },
      relations: ["participants"],
    });
  }

  async findDirectThreadBetween(userA: string, userB: string): Promise<ChatThread | null> {
    const qb = this.manager
      .getRepository(ChatThread)
      .createQueryBuilder("thread")
      .innerJoin("thread.participants", "p1", "p1.userId = :userA", { userA })
      .innerJoin("thread.participants", "p2", "p2.userId = :userB", { userB })
      .leftJoinAndSelect("thread.participants", "allParticipants")
      .where("thread.type = :type", { type: ChatThreadType.DIRECT });

    return qb.getOne();
  }

  async saveParticipant(participant: ChatParticipant): Promise<ChatParticipant> {
    return this.manager.getRepository(ChatParticipant).save(participant);
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    return this.manager.getRepository(ChatMessage).save(message);
  }

  async findThreadsForUser(userId: string): Promise<ChatThread[]> {
    const threadIdsSubQuery = this.manager
      .getRepository(ChatParticipant)
      .createQueryBuilder("cp")
      .select("cp.threadId")
      .where("cp.userId = :userId", { userId });

    return this.manager
      .getRepository(ChatThread)
      .createQueryBuilder("thread")
      .leftJoinAndSelect("thread.participants", "participants")
      .where(`thread.id IN (${threadIdsSubQuery.getQuery()})`)
      .setParameters(threadIdsSubQuery.getParameters())
      .orderBy("COALESCE(thread.lastMessageAt, thread.createdAt)", "DESC")
      .getMany();
  }

  async findMessagesForThread(threadId: string): Promise<ChatMessage[]> {
    return this.manager.getRepository(ChatMessage).find({
      where: { threadId },
      order: { createdAt: "ASC" },
    });
  }

  async markParticipantRead(threadId: string, userId: string): Promise<void> {
    await this.manager
      .getRepository(ChatParticipant)
      .update({ threadId, userId }, { lastReadAt: new Date() });
  }

  async getParticipants(threadId: string): Promise<ChatParticipant[]> {
    return this.manager.getRepository(ChatParticipant).find({
      where: { threadId },
    });
  }

  async findDirectoryUserById(userId: string): Promise<{ directory: CampusDirectory; user: UserAccount } | null> {
    const user = await this.manager.getRepository(UserAccount).findOne({ where: { id: userId } });
    if (!user) return null;
    const directory = await this.manager.getRepository(CampusDirectory).findOne({ where: { id: user.directoryId } });
    if (!directory) return null;
    return { directory, user };
  }

  async findDirectoryUsersByUserIds(userIds: string[]): Promise<Map<string, CampusDirectory>> {
    const map = new Map<string, CampusDirectory>();
    if (!userIds.length) return map;

    const users = await this.manager.getRepository(UserAccount).find({
      where: { id: In(userIds) },
    });
    const dirIds = users.map((u) => u.directoryId).filter(Boolean);
    if (!dirIds.length) return map;

    const directories = await this.manager.getRepository(CampusDirectory).find({
      where: { id: In(dirIds) },
    });
    const dirMap = new Map(directories.map((d) => [d.id, d]));

    for (const u of users) {
      const d = dirMap.get(u.directoryId);
      if (d) map.set(u.id, d);
    }
    return map;
  }

  async searchDirectoryUsers(query: string, excludeUserId: string): Promise<Array<{ user: UserAccount; directory: CampusDirectory }>> {
    const cleanQ = query.trim().toLowerCase();
    const dirQb = this.manager
      .getRepository(CampusDirectory)
      .createQueryBuilder("d");

    if (cleanQ) {
      dirQb.where("(LOWER(d.fullName) LIKE :q OR LOWER(d.usn) LIKE :q OR LOWER(d.collegeEmail) LIKE :q)", {
        q: `%${cleanQ}%`,
      });
    }

    dirQb.orderBy("d.fullName", "ASC").take(50);
    const directories = await dirQb.getMany();
    if (!directories.length) return [];

    const dirIds = directories.map((d) => d.id);
    const users = await this.manager.getRepository(UserAccount).find({
      where: {
        directoryId: In(dirIds),
        status: "active" as any,
      },
    });

    const userMap = new Map<string, UserAccount>();
    users.forEach((u) => {
      if (u.id !== excludeUserId) {
        userMap.set(u.directoryId, u);
      }
    });

    const results: Array<{ user: UserAccount; directory: CampusDirectory }> = [];
    directories.forEach((d) => {
      const u = userMap.get(d.id);
      if (u) {
        results.push({ user: u, directory: d });
      }
    });

    return results;
  }
}
