import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import {
  AddTeammateDto,
  CallOffDayDto,
  CancelBookingDto,
  CreateBookingDto,
  CreateFacilityDto,
  JoinWithCodeDto,
  QueryClosuresDto,
  QueryFacilitiesDto,
  QuerySlotsDto,
  ReopenDayDto,
  UpdateFacilityTimingDto,
} from "../dto/sports.dto";
import { SportsService } from "../service/sports.service";

@ApiTags("Sports")
@ApiBearerAuth()
@Controller("sports")
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get("facilities")
  @ApiOperation({ summary: "List all bookable campus sports facilities & courts" })
  async getFacilities(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryFacilitiesDto,
  ) {
    const facilities = await this.sportsService.getFacilities(
      user.tenantId,
      query,
    );
    return ApiResponseDto.success(facilities, "Facilities retrieved successfully");
  }

  @Get("facilities/:id")
  @ApiOperation({ summary: "Get sports facility details" })
  async getFacility(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ) {
    const facility = await this.sportsService.getFacilityById(user.tenantId, id);
    return ApiResponseDto.success(facility, "Facility retrieved successfully");
  }

  @Get("facilities/:id/slots")
  @ApiOperation({ summary: "Get slot availability for a facility on a specific date" })
  async getSlotAvailability(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Query() query: QuerySlotsDto,
  ) {
    const availability = await this.sportsService.getSlotAvailability(
      user.tenantId,
      id,
      query.date,
    );
    return ApiResponseDto.success(availability, "Slot availability retrieved successfully");
  }

  @Post("bookings")
  @ApiOperation({ summary: "Book a court slot with optional teammate open-game flag" })
  async createBooking(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateBookingDto,
  ) {
    const booking = await this.sportsService.createBooking(
      user.tenantId,
      {
        id: user.sub,
        fullName: user.email.split("@")[0],
      },
      body,
    );
    return ApiResponseDto.success(booking, "Court booked successfully! Game on.");
  }

  @Get("bookings/my")
  @ApiOperation({ summary: "Get user's court bookings with individual digital QR passes" })
  async getMyBookings(@CurrentUser() user: JwtPayload) {
    const bookings = await this.sportsService.getMyBookings(
      user.tenantId,
      user.sub,
    );
    return ApiResponseDto.success(bookings, "My bookings retrieved successfully");
  }

  @Post("bookings/join-code")
  @ApiOperation({ summary: "Join a game using a 6-digit invitation code" })
  async joinGameByCode(
    @CurrentUser() user: JwtPayload,
    @Body() body: JoinWithCodeDto,
  ) {
    const joined = await this.sportsService.joinGameByCode(
      user.tenantId,
      {
        id: user.sub,
        fullName: user.email.split("@")[0],
      },
      body.inviteCode,
    );
    return ApiResponseDto.success(
      joined,
      "You have joined the game roster! Your QR entry pass is ready.",
    );
  }

  @Post("bookings/:id/players")
  @ApiOperation({ summary: "Host adds a teammate directly to the booking roster" })
  async addTeammate(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: AddTeammateDto,
  ) {
    const player = await this.sportsService.addTeammate(
      user.tenantId,
      user.sub,
      id,
      body,
    );
    return ApiResponseDto.success(
      player,
      "Teammate added successfully to booking roster",
    );
  }

  @Get("open-games")
  @ApiOperation({ summary: "Discover campus games looking for players" })
  async getOpenGames(@CurrentUser() user: JwtPayload) {
    const games = await this.sportsService.getOpenGames(user.tenantId);
    return ApiResponseDto.success(games, "Open games retrieved successfully");
  }

  @Post("bookings/:id/cancel")
  @ApiOperation({ summary: "Cancel a court reservation" })
  async cancelBooking(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: CancelBookingDto,
  ) {
    const cancelled = await this.sportsService.cancelBooking(
      user.tenantId,
      user.sub,
      id,
      body,
    );
    return ApiResponseDto.success(cancelled, "Booking cancelled successfully");
  }

  @Post("admin/facilities")
  @ApiOperation({ summary: "Staff / Sports Admin: Register new court or ground" })
  async createFacility(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateFacilityDto,
  ) {
    const facility = await this.sportsService.createFacility(
      user.tenantId,
      body,
      user.sub,
    );
    return ApiResponseDto.success(facility, "Sports facility created successfully");
  }

  @Post("admin/call-off")
  @ApiOperation({ summary: "Admin: Call off court bookings for a day (e.g. rain, maintenance)" })
  async callOffDay(
    @CurrentUser() user: JwtPayload,
    @Body() body: CallOffDayDto,
  ) {
    const res = await this.sportsService.callOffDay(
      user.tenantId,
      body,
      user.sub,
    );
    return ApiResponseDto.success(res, res.message);
  }

  @Post("admin/reopen")
  @ApiOperation({ summary: "Admin: Reopen court bookings for a previously called-off day" })
  async reopenDay(
    @CurrentUser() user: JwtPayload,
    @Body() body: ReopenDayDto,
  ) {
    const res = await this.sportsService.reopenDay(
      user.tenantId,
      body,
      user.sub,
    );
    return ApiResponseDto.success(res, res.message);
  }

  @Get("admin/closures")
  @ApiOperation({ summary: "Admin: List current facility closures & called-off dates" })
  async getClosures(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryClosuresDto,
  ) {
    const closures = await this.sportsService.getClosures(
      user.tenantId,
      query.facilityId,
      query.closureDate,
    );
    return ApiResponseDto.success(closures, "Closures retrieved successfully");
  }

  @Patch("admin/facilities/:id/timing")
  @ApiOperation({ summary: "Admin: Update court operational timings or add extra slot timings" })
  async updateFacilityTiming(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateFacilityTimingDto,
  ) {
    const updated = await this.sportsService.updateFacilityTiming(
      user.tenantId,
      id,
      body,
      user.sub,
    );
    return ApiResponseDto.success(
      updated,
      "Facility timings updated successfully! New slots are live.",
    );
  }
}

