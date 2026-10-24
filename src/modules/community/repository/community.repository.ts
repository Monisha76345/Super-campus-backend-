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
  ): Promise<CommunityPost[]> {
    return this.manager
      .getRepository(CommunityPost)
      .createQueryBuilder("post")
      .where("post.campusId = :campusId", { campusId })
      .andWhere("post.status = :status", { status: PostStatus.APPROVED })
      .orderBy("post.createdAt", "DESC")
      .take(limit)
      .skip(offset)
      .getMany();
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
      .orderBy("post.createdAt", "DESC")
      .getMany();
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.manager
      .getRepository(CommunityPost)
      .update(id, {
        deletedAt: new Date(),
        deletedBy,
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
