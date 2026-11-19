import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { RegisterDeviceTokenReqDto } from "../dto/request/register-device-token.req.dto";
import { UpdateNotificationPreferenceReqDto } from "../dto/request/update-preference.req.dto";
import {
  NotificationPreferenceResDto,
  NotificationResDto,
  UnreadCountResDto,
} from "../dto/response/notification.res.dto";
import { NotificationService } from "../service/notification.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "List in-app notification inbox (newest first)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<ApiResponseDto<NotificationResDto[]>> {
    const data = await this.notifications.listInbox(
      user.sub,
      Math.min(Number(limit) || 50, 100),
      Number(offset) || 0,
    );
    return ApiResponseDto.success(data, "Success");
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Unread notification count for badge" })
  async unreadCount(@CurrentUser() user: JwtPayload): Promise<ApiResponseDto<UnreadCountResDto>> {
    const data = await this.notifications.unreadCount(user.sub);
    return ApiResponseDto.success(data, "Success");
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a single notification as read" })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<NotificationResDto>> {
    const data = await this.notifications.markRead(user.sub, id);
    return ApiResponseDto.success(data, "Marked as read");
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllRead(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<{ updated: number }>> {
    const data = await this.notifications.markAllRead(user.sub);
    return ApiResponseDto.success(data, "All marked as read");
  }

  @Post("device-token")
  @ApiOperation({ summary: "Register Expo push token for this device" })
  async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: RegisterDeviceTokenReqDto,
  ): Promise<ApiResponseDto<{ ok: true }>> {
    const data = await this.notifications.registerDeviceToken(user.sub, body);
    return ApiResponseDto.success(data, "Device token registered");
  }

  @Delete("device-token")
  @ApiOperation({ summary: "Unregister Expo push token (logout / permission revoked)" })
  async unregisterToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: RegisterDeviceTokenReqDto,
  ): Promise<ApiResponseDto<{ ok: true }>> {
    const data = await this.notifications.unregisterDeviceToken(user.sub, body.token);
    return ApiResponseDto.success(data, "Device token removed");
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification category preferences" })
  async getPreferences(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<NotificationPreferenceResDto>> {
    const data = await this.notifications.getPreferences(user.sub);
    return ApiResponseDto.success(data, "Success");
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Update notification category preferences" })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateNotificationPreferenceReqDto,
  ): Promise<ApiResponseDto<NotificationPreferenceResDto>> {
    const data = await this.notifications.updatePreferences(user.sub, body);
    return ApiResponseDto.success(data, "Preferences updated");
  }
}
