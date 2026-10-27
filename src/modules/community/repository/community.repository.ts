import { EntityManager } from "typeorm";
import { CommunityPost, PostStatus } from "../entity/community-post.model";

export class CommunityRepository {
  constructor(private readonly manager: EntityManager) {}

  async savePost(post: CommunityPost): Promise<CommunityPost> {
    return this.manager.getRepository(CommunityPost).save(post);
  }

  async findPostById(id: string): Promise<CommunityPost | null> {
    return this.manager.getRepository(CommunityPost).findOne({
      where: { id },
    });
  }

  async findFeedPosts(
    campusId: string,
    limit: number = 20,
    offset: number = 0,
    tab?: string,
    currentUserId?: string,
  ): Promise<CommunityPost[]> {
    const qb = this.manager
      .getRepository(CommunityPost)
      .createQueryBuilder("post")
      .where("post.campusId = :campusId", { campusId })
      .andWhere("post.status = :status", { status: PostStatus.APPROVED })
      .andWhere("post.deletedAt IS NULL");

    if (tab === "following" && currentUserId) {
      try {
        const { CampusConnection, ConnectionStatus } = await import("src/modules/connect/entity/campus-connection.model");
        const connections = await this.manager
          .getRepository(CampusConnection)
          .createQueryBuilder("c")
          .where("c.status = :status", { status: ConnectionStatus.ACCEPTED })
          .andWhere("(c.requesterUserId = :uid OR c.receiverUserId = :uid)", { uid: currentUserId })
          .getMany();

        const peerIds = new Set<string>();
        peerIds.add(currentUserId);
        for (const conn of connections) {
          if (conn.requesterUserId === currentUserId) {
            peerIds.add(conn.receiverUserId);
          } else {
            peerIds.add(conn.requesterUserId);
          }
        }

        qb.andWhere("post.authorId IN (:...peerIds)", { peerIds: Array.from(peerIds) });
      } catch {
        qb.andWhere("post.authorId = :uid", { uid: currentUserId });
      }
    } else if (tab === "clubs") {
      try {
        const { CampusClub } = await import("src/modules/connect/entity/campus-club.model");
        const clubs = await this.manager.getRepository(CampusClub).find({ select: ["leadUserId", "name"] });
        const leadUserIds = clubs.map((c) => c.leadUserId).filter(Boolean) as string[];

        qb.andWhere(
          "(post.authorRole IN (:...clubRoles) OR post.content LIKE :clubTag OR post.content LIKE :clubHash" +
          (leadUserIds.length > 0 ? " OR post.authorId IN (:...leadUserIds)" : "") +
          ")",
          {
            clubRoles: ["CLUB", "CLUB_LEAD", "COORDINATOR", "ADMIN"],
            clubTag: "%club%",
            clubHash: "%#club%",
            ...(leadUserIds.length > 0 ? { leadUserIds } : {}),
          },
        );
      } catch {
        qb.andWhere("(post.content LIKE :clubTag OR post.authorRole = 'CLUB')", { clubTag: "%club%" });
      }
    }

    return qb.orderBy("post.createdAt", "DESC").take(limit).skip(offset).getMany();
  }

  async findMySubmissions(
    campusId: string,
    authorId: string,
  ): Promise<CommunityPost[]> {
    return this.manager
      .getRepository(CommunityPost)
      .createQueryBuilder("post")
      .where("post.campusId = :campusId", { campusId })
      .andWhere("post.authorId = :authorId", { authorId })
      .andWhere("post.deletedAt IS NULL")
      .orderBy("post.createdAt", "DESC")
      .getMany();
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.manager
      .getRepository(CommunityPost)
      .update(id, {
        deletedAt: new Date(),
        deletedBy,
        status: PostStatus.REJECTED,
      });
  }

  async findAuthorDirectoryInfo(userId: string): Promise<{ fullName: string; loginId: string; usn: string | null } | null> {
    try {
      const { UserAccount } = await import("src/modules/user/entity/user.model");
      const { CampusDirectory } = await import("src/modules/user/entity/campus-directory.model");

      const user = await this.manager.getRepository(UserAccount).findOne({
        where: { id: userId },
      });
      if (!user) return null;

      let fullName = user.loginId?.split("@")[0] || "Campus Member";
      let usn: string | null = null;

      if (user.directoryId) {
        const dir = await this.manager.getRepository(CampusDirectory).findOne({
          where: { id: user.directoryId },
        });
        if (dir?.fullName) {
          fullName = dir.fullName;
        }
        if (dir?.usn) {
          usn = dir.usn;
        }
      }

      // If fullName is in usn.name format (e.g. 1nt22ec012.kavya), extract formatted name
      if (fullName.includes(".")) {
        const parts = fullName.split(".");
        if (parts.length > 1 && /^[0-9][a-zA-Z]{2}[0-9]{2}/i.test(parts[0])) {
          const raw = parts.slice(1).join(" ");
          fullName = raw.charAt(0).toUpperCase() + raw.slice(1);
        }
      }

      return { fullName, loginId: user.loginId, usn };
    } catch {
      return null;
    }
  }
}
