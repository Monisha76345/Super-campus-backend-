import { PostCommentItem, PostStatus, PostVisibility } from "../entity/community-post.model";

export class CommunityPostResDto {
  id: string;
  campusId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorHandle: string | null;
  authorAvatar: string | null;
  content: string;
  mediaUrls: string[];
  visibility: PostVisibility;
  status: PostStatus;
  rejectionReason: string | null;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  comments: PostCommentItem[];
  createdAt: string;
  updatedAt: string;
}

export class MySubmissionsResDto {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  posts: CommunityPostResDto[];
}
