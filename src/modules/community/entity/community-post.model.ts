import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseCamelCase } from "src/core/models/base.model";

export interface PostCommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
}

export enum PostVisibility {
  ONLY_ME = "ONLY_ME",
  CAMPUS = "CAMPUS",
  PUBLIC = "PUBLIC",
}

export enum PostStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity({ name: "community_posts" })
export class CommunityPost extends BaseCamelCase {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 64 })
  campusId: string;

  @Column({ type: "varchar", length: 36 })
  authorId: string;

  @Column({ type: "varchar", length: 255 })
  authorName: string;

  @Column({ type: "varchar", length: 64, default: "STUDENT" })
  authorRole: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  authorHandle: string | null;

  @Column({ type: "text", nullable: true })
  authorAvatar: string | null;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "json", nullable: true })
  mediaUrls: string[] | null;

  @Column({
    type: "enum",
    enum: PostVisibility,
    default: PostVisibility.CAMPUS,
  })
  visibility: PostVisibility;

  @Column({
    type: "enum",
    enum: PostStatus,
    default: PostStatus.APPROVED,
  })
  status: PostStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  rejectionReason: string | null;

  @Column({ type: "int", default: 0 })
  likeCount: number;

  @Column({ type: "json", nullable: true })
  likedUserIds: string[] | null;

  @Column({ type: "int", default: 0 })
  commentCount: number;

  @Column({ type: "json", nullable: true })
  comments: PostCommentItem[] | null;
}
