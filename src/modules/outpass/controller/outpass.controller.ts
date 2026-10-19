import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ROLES } from "src/core/common/constants/roles";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { Roles } from "src/core/common/decorators/roles.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { CreateOutpassReqDto } from "../dto/request/create-outpass.req.dto";
import { GateScanReqDto } from "../dto/request/gate-scan.req.dto";
import { UpdateOutpassStatusReqDto } from "../dto/request/update-outpass-status.req.dto";
import { GateScanResDto } from "../dto/response/gate-scan.res.dto";
import { OutpassResDto } from "../dto/response/outpass.res.dto";
import { OutpassService } from "../service/outpass.service";

@ApiTags("Outpass")
@ApiBearerAuth()
@Controller("outpass")
export class OutpassController {
  constructor(private readonly outpassService: OutpassService) {}

  @Post()
  @ApiOperation({ summary: "Create an outpass request" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateOutpassReqDto,
  ): Promise<ApiResponseDto<OutpassResDto>> {
    const data = await this.outpassService.create(user.sub, body);
    return ApiResponseDto.success(data, "Outpass request submitted successfully");
  }

  @Get("my-requests")
  @ApiOperation({ summary: "Get all outpass requests for the logged-in student" })
  async getMyRequests(@CurrentUser() user: JwtPayload): Promise<ApiResponseDto<OutpassResDto[]>> {
    const data = await this.outpassService.getMyRequests(user.sub);
    return ApiResponseDto.success(data, "Success");
  }

  @Get("admin/requests")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "Get all outpass requests across the campus (Admin/Warden only)" })
  async getAdminRequests(): Promise<ApiResponseDto<OutpassResDto[]>> {
    const data = await this.outpassService.getAdminRequests();
    return ApiResponseDto.success(data, "Success");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details of a specific outpass request" })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<OutpassResDto>> {
    const data = await this.outpassService.getById(user.sub, id);
    return ApiResponseDto.success(data, "Success");
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancel a pending outpass request" })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<OutpassResDto>> {
    const data = await this.outpassService.cancel(user.sub, id);
    return ApiResponseDto.success(data, "Outpass cancelled successfully");
  }

  @Patch(":id/review")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "Approve or reject an outpass request (Admin/Warden only)" })
  async review(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateOutpassStatusReqDto,
  ): Promise<ApiResponseDto<OutpassResDto>> {
    const data = await this.outpassService.review(user.sub, id, body);
    return ApiResponseDto.success(data, "Outpass status updated successfully");
  }

  @Post("gate-scan")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDENT)
  @ApiOperation({ summary: "Scan student QR code at gate for exit/entry with automated parent SMS alert" })
  async gateScan(
    @CurrentUser() user: JwtPayload,
    @Body() body: GateScanReqDto,
  ): Promise<ApiResponseDto<GateScanResDto>> {
    const data = await this.outpassService.gateScan(user.sub, body);
    return ApiResponseDto.success(data, "Gate scan logged and parent notified via SMS");
  }
}
