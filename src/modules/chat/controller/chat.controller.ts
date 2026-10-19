import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { ChatService } from "../service/chat.service";
import { CreateMessageReqDto } from "../dto/request/create-message.req.dto";
import { StartDirectChatReqDto } from "../dto/request/start-direct-chat.req.dto";
import { ChatThreadResDto } from "../dto/response/chat-thread.res.dto";
import { ChatMessageResDto } from "../dto/response/chat-message.res.dto";
import { SearchUserResDto } from "../dto/response/search-user.res.dto";

@ApiTags("Chat")
@ApiBearerAuth()
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("threads")
  @ApiOperation({ summary: "List conversation threads for current user" })
  async getThreads(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<ChatThreadResDto[]>> {
    const threads = await this.chatService.getThreads(user.sub);
    return ApiResponseDto.success(threads, "Threads retrieved successfully");
  }

  @Post("threads/direct")
  @ApiOperation({ summary: "Find or start a 1-on-1 direct conversation with a campus member" })
  async startDirectChat(
    @CurrentUser() user: JwtPayload,
    @Body() body: StartDirectChatReqDto,
  ): Promise<ApiResponseDto<ChatThreadResDto>> {
    const thread = await this.chatService.startDirectChat(user.sub, body.recipientUserId);
    return ApiResponseDto.success(thread, "Thread initialized");
  }

  @Get("threads/:threadId/messages")
  @ApiOperation({ summary: "Get chronological messages in a thread" })
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param("threadId") threadId: string,
  ): Promise<ApiResponseDto<ChatMessageResDto[]>> {
    const messages = await this.chatService.getMessages(user.sub, threadId);
    return ApiResponseDto.success(messages, "Messages retrieved successfully");
  }

  @Post("threads/:threadId/messages")
  @ApiOperation({ summary: "Send a message into a thread (up to 2000 chars)" })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param("threadId") threadId: string,
    @Body() body: CreateMessageReqDto,
  ): Promise<ApiResponseDto<ChatMessageResDto>> {
    const message = await this.chatService.sendMessage(user.sub, threadId, body.content);
    return ApiResponseDto.success(message, "Message sent successfully");
  }

  @Get("users/search")
  @ApiOperation({ summary: "Search campus members by Name or USN to start a chat" })
  async searchUsers(
    @CurrentUser() user: JwtPayload,
    @Query("query") query?: string,
  ): Promise<ApiResponseDto<SearchUserResDto[]>> {
    const users = await this.chatService.searchUsers(user.sub, query || "");
    return ApiResponseDto.success(users, "Users found");
  }
}
