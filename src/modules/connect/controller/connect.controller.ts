import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { ConnectService } from "../service/connect.service";
import { CreateEventReqDto } from "../dto/request/create-event.req.dto";
import { CreateOpportunityReqDto } from "../dto/request/create-opportunity.req.dto";
import { CampusEventResDto } from "../dto/response/campus-event.res.dto";
import { CampusClubResDto } from "../dto/response/campus-club.res.dto";
import { CampusOpportunityResDto } from "../dto/response/campus-opportunity.res.dto";
import { ConnectMemberResDto } from "../dto/response/connect-member.res.dto";
import { OpportunityType } from "../entity/enums/opportunity-type.enum";

@ApiTags("Connect")
@ApiBearerAuth()
@Controller("connect")
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Get("events")
  @ApiOperation({ summary: "List upcoming campus events" })
  async getEvents(): Promise<ApiResponseDto<CampusEventResDto[]>> {
    const list = await this.connectService.getEvents();
    return ApiResponseDto.success(list, "Events retrieved");
  }

  @Post("events")
  @ApiOperation({ summary: "Publish a new campus event" })
  async createEvent(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateEventReqDto,
  ): Promise<ApiResponseDto<CampusEventResDto>> {
    const event = await this.connectService.createEvent(user.sub, body);
    return ApiResponseDto.success(event, "Event published successfully");
  }

  @Get("clubs")
  @ApiOperation({ summary: "List active campus clubs" })
  async getClubs(): Promise<ApiResponseDto<CampusClubResDto[]>> {
    const list = await this.connectService.getClubs();
    return ApiResponseDto.success(list, "Clubs retrieved");
  }

  @Get("opportunities")
  @ApiOperation({ summary: "List internships and job opportunities" })
  async getOpportunities(
    @Query("type") type?: OpportunityType,
  ): Promise<ApiResponseDto<CampusOpportunityResDto[]>> {
    const list = await this.connectService.getOpportunities(type);
    return ApiResponseDto.success(list, "Opportunities retrieved");
  }

  @Post("opportunities")
  @ApiOperation({ summary: "Publish a new campus internship or job opportunity" })
  async createOpportunity(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateOpportunityReqDto,
  ): Promise<ApiResponseDto<CampusOpportunityResDto>> {
    const opp = await this.connectService.createOpportunity(user.sub, body);
    return ApiResponseDto.success(opp, "Opportunity published successfully");
  }

  @Get("members")
  @ApiOperation({ summary: "Discover campus members, alumni, students, and faculty" })
  async getMembers(
    @CurrentUser() user: JwtPayload,
    @Query("role") role?: string,
    @Query("batch") batch?: string,
    @Query("q") query?: string,
  ): Promise<ApiResponseDto<ConnectMemberResDto[]>> {
    const list = await this.connectService.getMembers(user?.sub, { role, batch, query });
    return ApiResponseDto.success(list, "Members retrieved");
  }

  @Get("members/:userId")
  @ApiOperation({ summary: "Get dynamic details for a single campus member" })
  async getMember(
    @CurrentUser() user: JwtPayload,
    @Param("userId") targetUserId: string,
  ): Promise<ApiResponseDto<ConnectMemberResDto>> {
    const member = await this.connectService.getMemberById(user.sub, targetUserId);
    return ApiResponseDto.success(member, "Member profile retrieved");
  }

  @Post("members/:userId/connect")
  @ApiOperation({ summary: "Send a connection request to a campus member" })
  async connectWithMember(
    @CurrentUser() user: JwtPayload,
    @Param("userId") targetUserId: string,
  ): Promise<ApiResponseDto<{ status: string; message: string }>> {
    const result = await this.connectService.connectWithMember(user.sub, targetUserId);
    return ApiResponseDto.success(result, result.message);
  }

  @Get("requests/incoming")
  @ApiOperation({ summary: "Get pending incoming connection requests for current user" })
  async getIncomingRequests(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<any[]>> {
    const list = await this.connectService.getIncomingRequests(user.sub);
    return ApiResponseDto.success(list, "Incoming connection requests retrieved");
  }

  @Post("requests/:connectionId/respond")
  @ApiOperation({ summary: "Accept or decline a connection request" })
  async respondToRequest(
    @CurrentUser() user: JwtPayload,
    @Param("connectionId") connectionId: string,
    @Body() body: { action: "ACCEPT" | "DECLINE" },
  ): Promise<ApiResponseDto<{ status: string; message: string }>> {
    const result = await this.connectService.respondToConnectionRequest(
      user.sub,
      connectionId,
      body.action,
    );
    return ApiResponseDto.success(result, result.message);
  }

  @Get("connections/mine")
  @ApiOperation({ summary: "Get current user's accepted connections network" })
  async getMyConnections(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<ConnectMemberResDto[]>> {
    const list = await this.connectService.getMyConnections(user.sub);
    return ApiResponseDto.success(list, "Connections network retrieved");
  }
}
