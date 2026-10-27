import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { CommunityRepository } from "../repository/community.repository";
import { CommunityPost } from "../entity/community-post.model";

@Injectable()
export class CommunityDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<CommunityRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new CommunityRepository(manager);
  }

  async savePost(namespace: string, post: CommunityPost): Promise<CommunityPost> {
    return (await this.repo(namespace)).savePost(post);
  }

  async findPostById(namespace: string, id: string): Promise<CommunityPost | null> {
    return (await this.repo(namespace)).findPostById(id);
  }

  async findFeedPosts(
    namespace: string,
    limit: number,
    offset: number,
    tab?: string,
    currentUserId?: string,
  ): Promise<CommunityPost[]> {
    return (await this.repo(namespace)).findFeedPosts(namespace, limit, offset, tab, currentUserId);
  }

  async findMySubmissions(
    namespace: string,
    authorId: string,
  ): Promise<CommunityPost[]> {
    return (await this.repo(namespace)).findMySubmissions(namespace, authorId);
  }

  async softDelete(namespace: string, id: string, deletedBy: string): Promise<void> {
    return (await this.repo(namespace)).softDelete(id, deletedBy);
  }

  async findAuthorDirectoryInfo(namespace: string, userId: string) {
    return (await this.repo(namespace)).findAuthorDirectoryInfo(userId);
  }
}
