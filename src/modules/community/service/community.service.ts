import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { AddCommentDto } from "../dto/add-comment.dto";
import {
  CommunityPostResDto,
  MySubmissionsResDto,
} from "../dto/community-post.res.dto";
import { CreatePostDto } from "../dto/create-post.dto";
import { PostQueryDto } from "../dto/post-query.dto";
import {
  CommunityPost,
  PostCommentItem,
  PostStatus,
  PostVisibility,
} from "../entity/community-post.model";
import { CommunityDataService } from "./community-data.service";

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly data: CommunityDataService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private mapToDto(post: CommunityPost, currentUserId: string): CommunityPostResDto {
    const likedList = Array.isArray(post.likedUserIds) ? post.likedUserIds : [];
    const commentsList = Array.isArray(post.comments) ? post.comments : [];
    const media = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

    // If authorName is in loginId format (e.g. 1nt22ec012.kavya), extract proper name
    let displayName = post.authorName;
    let displayHandle = post.authorHandle;

    if (displayName && displayName.includes(".")) {
      const parts = displayName.split(".");
      if (parts.length > 1 && /^[0-9][a-zA-Z]{2}[0-9]{2}/i.test(parts[0])) {
        const raw = parts.slice(1).join(" ");
        displayName = raw.charAt(0).toUpperCase() + raw.slice(1);
        if (!displayHandle) {
          displayHandle = `@${post.authorName.toLowerCase()}`;
        }
      }
    }

    return {
      id: post.id,
      campusId: post.campusId,
      authorId: post.authorId,
      authorName: displayName,
      authorRole: post.authorRole,
      authorHandle: displayHandle,
      authorAvatar: post.authorAvatar,
      content: post.content,
      mediaUrls: media,
      visibility: post.visibility,
      status: post.status,
      rejectionReason: post.rejectionReason,
      likeCount: post.likeCount || likedList.length,
      commentCount: post.commentCount || commentsList.length,
      isLikedByMe: likedList.includes(currentUserId),
      comments: commentsList,
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async createPost(user: JwtPayload, dto: CreatePostDto): Promise<CommunityPostResDto> {
    const namespace = this.tenantContext.getTenantId();
    const postId = randomUUID();

    let authorName = "Campus Member";
    let authorHandle = user.email ? `@${user.email.split("@")[0]}` : null;

    try {
      const authorInfo = await this.data.findAuthorDirectoryInfo(namespace, user.sub);
      if (authorInfo?.fullName) {
        authorName = authorInfo.fullName;
        if (authorInfo.loginId) {
          authorHandle = `@${authorInfo.loginId.split("@")[0]}`;
        }
      } else {
        const emailPrefix = user.email?.split("@")[0] || "Campus Member";
        if (emailPrefix.includes(".")) {
          const parts = emailPrefix.split(".");
          const raw = parts.slice(1).join(" ");
          authorName = raw.charAt(0).toUpperCase() + raw.slice(1);
        } else {
          authorName = emailPrefix;
        }
      }
    } catch {
      authorName = user.email?.split("@")[0] || "Campus Member";
    }
    const authorRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "STUDENT";

    const post = new CommunityPost();
    post.id = postId;
    post.campusId = namespace;
    post.authorId = user.sub;
    post.authorName = authorName;
    post.authorRole = authorRole;
    post.authorHandle = authorHandle;
    post.authorAvatar = null;
    post.content = dto.content.trim();
    post.mediaUrls = dto.mediaUrls && dto.mediaUrls.length > 0 ? dto.mediaUrls : [];
    post.visibility = dto.visibility || PostVisibility.CAMPUS;
    post.status = PostStatus.APPROVED; // Direct publish for seamless engagement
    post.rejectionReason = null;
    post.likeCount = 0;
    post.likedUserIds = [];
    post.commentCount = 0;
    post.comments = [];
    post.createdBy = user.sub;
    post.updatedBy = user.sub;

    const saved = await this.data.savePost(namespace, post);
    this.logger.log(`Created community post ${saved.id} by author ${user.sub}`);
    return this.mapToDto(saved, user.sub);
  }

  async getFeed(user: JwtPayload, query: PostQueryDto): Promise<CommunityPostResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const limit = query.limit || 20;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    const posts = await this.data.findFeedPosts(namespace, limit, offset);
    return posts.map((post) => this.mapToDto(post, user.sub));
  }

  async getMySubmissions(user: JwtPayload): Promise<MySubmissionsResDto> {
    const namespace = this.tenantContext.getTenantId();
    const posts = await this.data.findMySubmissions(namespace, user.sub);

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    const dtos = posts.map((post) => {
      if (post.status === PostStatus.PENDING_APPROVAL) pendingCount++;
      else if (post.status === PostStatus.APPROVED) approvedCount++;
      else if (post.status === PostStatus.REJECTED) rejectedCount++;

      return this.mapToDto(post, user.sub);
    });

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      posts: dtos,
    };
  }

  async toggleLike(
    user: JwtPayload,
    postId: string,
  ): Promise<{ likeCount: number; isLikedByMe: boolean }> {
    const namespace = this.tenantContext.getTenantId();
    const post = await this.data.findPostById(namespace, postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const likedList = Array.isArray(post.likedUserIds) ? [...post.likedUserIds] : [];
    const index = likedList.indexOf(user.sub);
    let isLikedByMe: boolean;

    if (index >= 0) {
      likedList.splice(index, 1);
      isLikedByMe = false;
    } else {
      likedList.push(user.sub);
      isLikedByMe = true;
    }

    post.likedUserIds = likedList;
    post.likeCount = likedList.length;
    post.updatedBy = user.sub;

    await this.data.savePost(namespace, post);

    return {
      likeCount: post.likeCount,
      isLikedByMe,
    };
  }

  async addComment(
    user: JwtPayload,
    postId: string,
    dto: AddCommentDto,
  ): Promise<CommunityPostResDto> {
    const namespace = this.tenantContext.getTenantId();
    const post = await this.data.findPostById(namespace, postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const commentsList = Array.isArray(post.comments) ? [...post.comments] : [];
    const authorName =
      (user as any).fullName ||
      (user as any).name ||
      user.email?.split("@")[0] ||
      "Campus Member";
    const authorRole = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "STUDENT";

    const newComment: PostCommentItem = {
      id: randomUUID(),
      authorId: user.sub,
      authorName,
      authorRole,
      authorAvatar: null,
      content: dto.content.trim(),
      createdAt: new Date().toISOString(),
    };

    commentsList.push(newComment);
    post.comments = commentsList;
    post.commentCount = commentsList.length;
    post.updatedBy = user.sub;

    const saved = await this.data.savePost(namespace, post);
    return this.mapToDto(saved, user.sub);
  }

  async deletePost(user: JwtPayload, postId: string): Promise<void> {
    const namespace = this.tenantContext.getTenantId();
    const post = await this.data.findPostById(namespace, postId);
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const isAuthor = post.authorId === user.sub;
    const roles = user.roles || [];
    const isAdmin = roles.some((r) => r === "admin" || r === "campus_admin" || r === "superadmin");

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException("You do not have permission to delete this post");
    }

    await this.data.softDelete(namespace, postId, user.sub);
    this.logger.log(`Soft deleted community post ${postId} by ${user.sub}`);
  }
}
