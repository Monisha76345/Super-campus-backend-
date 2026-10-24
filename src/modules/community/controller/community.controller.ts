import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { AddCommentDto } from "../dto/add-comment.dto";
import {
  CommunityPostResDto,
  MySubmissionsResDto,
} from "../dto/community-post.res.dto";
import { CreatePostDto } from "../dto/create-post.dto";
import { PostQueryDto } from "../dto/post-query.dto";
import { CommunityService } from "../service/community.service";

@ApiTags("Community")
@ApiBearerAuth()
@Controller("community")
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post("posts")
  @ApiOperation({ summary: "Create a new post in the campus community feed" })
  async createPost(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreatePostDto,
  ): Promise<ApiResponseDto<CommunityPostResDto>> {
    const post = await this.communityService.createPost(user, body);
    return ApiResponseDto.success(post, "Post created successfully");
  }

  @Get("posts")
  @ApiOperation({ summary: "Get live campus community feed" })
  async getFeed(
    @CurrentUser() user: JwtPayload,
    @Query() query: PostQueryDto,
  ): Promise<ApiResponseDto<CommunityPostResDto[]>> {
    const feed = await this.communityService.getFeed(user, query);
    return ApiResponseDto.success(feed, "Feed retrieved successfully");
  }

  @Get("my-submissions")
  @ApiOperation({ summary: "Get user's submitted posts and status breakdown" })
  async getMySubmissions(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<MySubmissionsResDto>> {
    const result = await this.communityService.getMySubmissions(user);
    return ApiResponseDto.success(result, "Submissions retrieved successfully");
  }

  @Post("posts/:id/like")
  @ApiOperation({ summary: "Toggle like on a community post" })
  async toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<{ likeCount: number; isLikedByMe: boolean }>> {
    const result = await this.communityService.toggleLike(user, id);
    return ApiResponseDto.success(result, "Post like updated");
  }

  @Post("posts/:id/comments")
  @ApiOperation({ summary: "Add a comment to a community post" })
  async addComment(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: AddCommentDto,
  ): Promise<ApiResponseDto<CommunityPostResDto>> {
    const updated = await this.communityService.addComment(user, id, body);
    return ApiResponseDto.success(updated, "Comment added successfully");
  }

  @Delete("posts/:id")
  @ApiOperation({ summary: "Soft delete a community post" })
  async deletePost(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<{ deleted: boolean }>> {
    await this.communityService.deletePost(user, id);
    return ApiResponseDto.success({ deleted: true }, "Post deleted successfully");
  }
}
