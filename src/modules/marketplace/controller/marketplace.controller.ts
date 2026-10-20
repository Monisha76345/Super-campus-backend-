import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { CreateMarketplaceItemReqDto } from "../dto/request/create-marketplace-item.req.dto";
import { MarketplaceQueryDto } from "../dto/request/marketplace-query.dto";
import { UpdateItemStatusReqDto } from "../dto/request/update-item-status.req.dto";
import { MarketplaceItemResDto } from "../dto/response/marketplace-item.res.dto";
import { MarketplaceLikeResDto } from "../dto/response/marketplace-like.res.dto";
import { MarketplaceService } from "../service/marketplace.service";

@ApiTags("Marketplace")
@ApiBearerAuth()
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post("items")
  @ApiOperation({
    summary: "Publish a marketplace listing",
    description:
      "Admin postings are approved immediately; student listings enter PENDING_APPROVAL review status.",
  })
  async createItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMarketplaceItemReqDto,
  ): Promise<ApiResponseDto<MarketplaceItemResDto>> {
    const result = await this.marketplaceService.createItem(user, dto);
    const message =
      result.status === "APPROVED"
        ? "Listing published successfully"
        : "Listing submitted for campus admin approval";
    return ApiResponseDto.success(result, message);
  }

  @Get("items")
  @ApiOperation({
    summary: "Browse approved marketplace listings",
    description: "Filter by category, condition, or search query.",
  })
  async listItems(
    @CurrentUser() user: JwtPayload,
    @Query() query: MarketplaceQueryDto,
  ): Promise<ApiResponseDto<MarketplaceItemResDto[]>> {
    const result = await this.marketplaceService.findAll(user, query);
    return ApiResponseDto.success(result, "Success");
  }

  @Get("items/my")
  @ApiOperation({
    summary: "List current user's listings",
    description: "Returns all listings created by the user, including pending, approved, and sold.",
  })
  async myItems(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<MarketplaceItemResDto[]>> {
    const result = await this.marketplaceService.findMyItems(user);
    return ApiResponseDto.success(result, "Success");
  }

  @Get("items/pending")
  @ApiOperation({
    summary: "Admin only: List items pending review",
    description: "Returns items submitted by students waiting for admin moderation.",
  })
  async pendingItems(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<MarketplaceItemResDto[]>> {
    const result = await this.marketplaceService.findPending(user);
    return ApiResponseDto.success(result, "Success");
  }

  @Get("items/:id")
  @ApiOperation({
    summary: "Get marketplace item details",
  })
  async getItem(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<MarketplaceItemResDto>> {
    const result = await this.marketplaceService.findById(user, id);
    return ApiResponseDto.success(result, "Success");
  }

  @Patch("items/:id/status")
  @ApiOperation({
    summary: "Update listing status (Approve / Reject / Mark Sold)",
    description: "Admin can approve or reject; seller or admin can mark as sold.",
  })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateItemStatusReqDto,
  ): Promise<ApiResponseDto<MarketplaceItemResDto>> {
    const result = await this.marketplaceService.updateStatus(user, id, dto);
    return ApiResponseDto.success(result, `Listing status updated to ${result.status}`);
  }

  @Post("items/:id/like")
  @ApiOperation({
    summary: "Toggle like on a listing",
    description: "Likes or unlikes an item, incrementing or decrementing likeCount.",
  })
  async toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<MarketplaceLikeResDto>> {
    const result = await this.marketplaceService.toggleLike(user, id);
    return ApiResponseDto.success(result, result.isLiked ? "Item liked" : "Item unliked");
  }

  @Delete("items/:id")
  @ApiOperation({
    summary: "Delete a listing",
  })
  async deleteItem(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.marketplaceService.deleteItem(user, id);
    return ApiResponseDto.success(null, "Listing deleted successfully");
  }
}
