import { EntityManager, In } from "typeorm";
import { CampusEvent } from "../entity/campus-event.model";
import { CampusClub } from "../entity/campus-club.model";
import { CampusOpportunity } from "../entity/campus-opportunity.model";
import { CampusConnection, ConnectionStatus } from "../entity/campus-connection.model";
import { EventStatus } from "../entity/enums/event-status.enum";
import { OpportunityType } from "../entity/enums/opportunity-type.enum";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";
import { UserAccount } from "src/modules/user/entity/user.model";
import { UserProfile } from "src/modules/user/entity/profile.model";

export class ConnectRepository {
  constructor(private readonly manager: EntityManager) {}

  async findEvents(status?: EventStatus): Promise<CampusEvent[]> {
    const qb = this.manager.getRepository(CampusEvent).createQueryBuilder("e");
    if (status) {
      qb.where("e.status = :status", { status });
    }
    qb.orderBy("e.starts_at", "ASC");
    return qb.getMany();
  }

  async createEvent(event: CampusEvent): Promise<CampusEvent> {
    return this.manager.getRepository(CampusEvent).save(event);
  }

  async findEventById(id: string): Promise<CampusEvent | null> {
    return this.manager.getRepository(CampusEvent).findOne({ where: { id } });
  }

  async findClubs(): Promise<CampusClub[]> {
    return this.manager.getRepository(CampusClub).find({
      where: { status: "ACTIVE" },
      orderBy: { memberCount: "DESC" },
    } as any);
  }

  async findOpportunities(type?: OpportunityType): Promise<CampusOpportunity[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.manager.getRepository(CampusOpportunity).find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async createOpportunity(opportunity: CampusOpportunity): Promise<CampusOpportunity> {
    return this.manager.getRepository(CampusOpportunity).save(opportunity);
  }

  async searchMembers(options: {
    role?: string;
    batch?: string;
    query?: string;
  }): Promise<Array<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null }>> {
    const dirQb = this.manager.getRepository(CampusDirectory).createQueryBuilder("d");

    if (options.role && options.role.toLowerCase() !== "all") {
      const r = options.role.toUpperCase();
      if (r === "ALUMNI") {
        dirQb.andWhere("d.role = 'ALUMNI'");
      } else if (r === "STUDENTS" || r === "STUDENT") {
        dirQb.andWhere("d.role = 'STUDENT'");
      } else if (r === "FACULTY") {
        dirQb.andWhere("d.role = 'FACULTY'");
      }
    }

    if (options.batch && options.batch.toLowerCase() !== "all" && options.batch.toLowerCase() !== "all batches") {
      dirQb.andWhere("d.batch = :batch", { batch: options.batch.trim() });
    }

    if (options.query && options.query.trim()) {
      const q = `%${options.query.trim().toLowerCase()}%`;
      dirQb.andWhere("(LOWER(d.fullName) LIKE :q OR LOWER(d.usn) LIKE :q OR LOWER(d.collegeEmail) LIKE :q)", { q });
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

    const userIds = users.map((u) => u.id);
    const profiles = userIds.length
      ? await this.manager.getRepository(UserProfile).find({
          where: { userId: In(userIds) },
          select: ["id", "userId", "photoKey"],
        })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const userMap = new Map(users.map((u) => [u.directoryId, u]));

    const results: Array<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null }> = [];
    directories.forEach((d) => {
      const u = userMap.get(d.id);
      if (u) {
        results.push({
          user: u,
          directory: d,
          profile: profileMap.get(u.id) || null,
        });
      }
    });

    return results;
  }

  async findMemberById(
    userId: string,
  ): Promise<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null } | null> {
    const user = await this.manager.getRepository(UserAccount).findOne({
      where: { id: userId },
    });
    if (!user || !user.directoryId) return null;

    const directory = await this.manager.getRepository(CampusDirectory).findOne({
      where: { id: user.directoryId },
    });
    if (!directory) return null;

    const profile = await this.manager.getRepository(UserProfile).findOne({
      where: { userId },
    });

    return { user, directory, profile };
  }

  private async ensureConnectionTable(): Promise<void> {
    try {
      await this.manager.query(`
        CREATE TABLE IF NOT EXISTS \`campus_connection\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`requester_user_id\` VARCHAR(36) NOT NULL,
          \`receiver_user_id\` VARCHAR(36) NOT NULL,
          \`status\` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_connection_pair\` (\`requester_user_id\`, \`receiver_user_id\`),
          INDEX \`idx_conn_receiver\` (\`receiver_user_id\`, \`status\`),
          INDEX \`idx_conn_requester\` (\`requester_user_id\`, \`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {
      // Table already exists or fallback safely
    }
  }

  async findConnection(
    requesterId: string,
    receiverId: string,
  ): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).findOne({
        where: [
          { requesterUserId: requesterId, receiverUserId: receiverId },
          { requesterUserId: receiverId, receiverUserId: requesterId },
        ],
      });
    } catch {
      return null;
    }
  }

  async saveConnection(connection: CampusConnection): Promise<CampusConnection> {
    await this.ensureConnectionTable();
    return this.manager.getRepository(CampusConnection).save(connection);
  }

  async findConnectionsForUser(userId: string): Promise<CampusConnection[]> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).find({
        where: [
          { requesterUserId: userId },
          { receiverUserId: userId },
        ],
      });
    } catch {
      return [];
    }
  }

  async findIncomingRequests(
    receiverUserId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    await this.ensureConnectionTable();
    try {
      const requests = await this.manager.getRepository(CampusConnection).find({
        where: {
          receiverUserId,
          status: ConnectionStatus.PENDING,
        },
        order: { createdAt: "DESC" },
      });
      if (!requests.length) return [];

      const requesterUserIds = requests.map((r) => r.requesterUserId);
      const users = await this.manager.getRepository(UserAccount).find({
        where: { id: In(requesterUserIds) },
      });
      const dirIds = users.map((u) => u.directoryId).filter(Boolean) as string[];
      const directories = dirIds.length
        ? await this.manager.getRepository(CampusDirectory).find({
            where: { id: In(dirIds) },
          })
        : [];
      const profiles = await this.manager.getRepository(UserProfile).find({
        where: { userId: In(requesterUserIds) },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const dirMap = new Map(directories.map((d) => [d.id, d]));
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const results: Array<{
        connection: CampusConnection;
        user: UserAccount;
        directory: CampusDirectory;
        profile: UserProfile | null;
      }> = [];

      requests.forEach((conn) => {
        const u = userMap.get(conn.requesterUserId);
        if (u) {
          const d = dirMap.get(u.directoryId);
          if (d) {
            results.push({
              connection: conn,
              user: u,
              directory: d,
              profile: profileMap.get(u.id) || null,
            });
          }
        }
      });

      return results;
    } catch {
      return [];
    }
  }

  async findConnectionById(id: string): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).findOne({
        where: { id },
      });
    } catch {
      return null;
    }
  }

  async updateConnectionStatus(
    id: string,
    status: ConnectionStatus,
  ): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    const conn = await this.findConnectionById(id);
    if (!conn) return null;
    conn.status = status;
    return this.manager.getRepository(CampusConnection).save(conn);
  }

  async findAcceptedConnections(
    userId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    await this.ensureConnectionTable();
    try {
      const connections = await this.manager.getRepository(CampusConnection).find({
        where: [
          { requesterUserId: userId, status: ConnectionStatus.ACCEPTED },
          { receiverUserId: userId, status: ConnectionStatus.ACCEPTED },
        ],
      });
      if (!connections.length) return [];

      const otherUserIds = connections.map((c) =>
        c.requesterUserId === userId ? c.receiverUserId : c.requesterUserId,
      );
      const users = await this.manager.getRepository(UserAccount).find({
        where: { id: In(otherUserIds) },
      });
      const dirIds = users.map((u) => u.directoryId).filter(Boolean) as string[];
      const directories = dirIds.length
        ? await this.manager.getRepository(CampusDirectory).find({
            where: { id: In(dirIds) },
          })
        : [];
      const profiles = await this.manager.getRepository(UserProfile).find({
        where: { userId: In(otherUserIds) },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const dirMap = new Map(directories.map((d) => [d.id, d]));
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const results: Array<{
        connection: CampusConnection;
        user: UserAccount;
        directory: CampusDirectory;
        profile: UserProfile | null;
      }> = [];

      connections.forEach((conn) => {
        const otherId =
          conn.requesterUserId === userId ? conn.receiverUserId : conn.requesterUserId;
        const u = userMap.get(otherId);
        if (u) {
          const d = dirMap.get(u.directoryId);
          if (d) {
            results.push({
              connection: conn,
              user: u,
              directory: d,
              profile: profileMap.get(u.id) || null,
            });
          }
        }
      });

      return results;
    } catch {
      return [];
    }
  }
}
