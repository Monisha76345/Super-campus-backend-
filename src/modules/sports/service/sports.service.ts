import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
  AddTeammateDto,
  CallOffDayDto,
  CancelBookingDto,
  CreateBookingDto,
  CreateFacilityDto,
  QueryFacilitiesDto,
  ReopenDayDto,
  UpdateFacilityTimingDto,
} from "../dto/sports.dto";
import { BookingStatus, PlayerRole } from "../entity/enums/booking-status.enum";
import { SportsBooking } from "../entity/sports-booking.model";
import { SportsBookingPlayer } from "../entity/sports-booking-player.model";
import { SportsFacilityClosure } from "../entity/sports-facility-closure.model";
import { SportsFacility } from "../entity/sports-facility.model";
import { SportsDataService } from "./sports-data.service";

export interface SlotAvailability {
  startTime: string; // "06:00:00"
  endTime: string;   // "07:00:00"
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST";
  blockedReason?: string;
  bookingId?: string;
  isOpenGame?: boolean;
  currentPlayers?: number;
  maxPlayers?: number;
}


@Injectable()
export class SportsService {
  constructor(private readonly dataService: SportsDataService) {}

  // ---------------- Facilities ----------------
  async getFacilities(
    namespace: string,
    query?: QueryFacilitiesDto,
  ): Promise<SportsFacility[]> {
    return this.dataService.findFacilities(namespace, query);
  }

  async getFacilityById(
    namespace: string,
    id: string,
  ): Promise<SportsFacility> {
    const facility = await this.dataService.findFacilityById(namespace, id);
    if (!facility) {
      throw new NotFoundException(`Sports facility with id ${id} not found`);
    }
    return facility;
  }

  // ---------------- Slot Availability Engine ----------------
  async getSlotAvailability(
    namespace: string,
    facilityId: string,
    date: string,
  ): Promise<{ facility: SportsFacility; date: string; slots: SlotAvailability[] }> {
    const facility = await this.getFacilityById(namespace, facilityId);
    const bookings = await this.dataService.findActiveBookingsForFacilityDate(
      namespace,
      facilityId,
      date,
    );
    const closures = await this.dataService.findClosuresForFacilityDate(
      namespace,
      facilityId,
      date,
    );

    const bookingMap = new Map<string, SportsBooking>();
    for (const b of bookings) {
      const timeKey = b.startTime.slice(0, 5); // "06:00"
      bookingMap.set(timeKey, b);
    }

    const isSlotBlockedByClosure = (startTime: string, endTime: string): string | null => {
      const s = startTime.slice(0, 5);
      const e = endTime.slice(0, 5);
      for (const c of closures) {
        const cStart = c.startTime.slice(0, 5);
        const cEnd = c.endTime.slice(0, 5);
        // Full day closure
        if (cStart === "00:00" && cEnd >= "22:00") {
          return c.reason || "Court bookings called off by administration";
        }
        // Overlapping slot closure
        if (s >= cStart && s < cEnd) {
          return c.reason || "Time slot blocked by administration";
        }
      }
      return null;
    };

    // Determine current time cutoff if date is today
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const isToday = date === todayStr;
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const slots: SlotAvailability[] = [];
    const [openH, openM] = facility.openingTime.split(":").map(Number);
    const [closeH, closeM] = facility.closingTime.split(":").map(Number);

    let startTotalMinutes = openH * 60 + (openM || 0);
    const endTotalMinutes = closeH * 60 + (closeM || 0);
    const duration = facility.slotDurationMinutes || 60;

    while (startTotalMinutes + duration <= endTotalMinutes) {
      const slotStartH = Math.floor(startTotalMinutes / 60);
      const slotStartM = startTotalMinutes % 60;
      const slotEndTotal = startTotalMinutes + duration;
      const slotEndH = Math.floor(slotEndTotal / 60);
      const slotEndM = slotEndTotal % 60;

      const startTimeStr = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}:00`;
      const endTimeStr = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}:00`;
      const timeKey = startTimeStr.slice(0, 5);

      let status: SlotAvailability["status"] = "AVAILABLE";
      let bookingMeta: Partial<SlotAvailability> = {};

      const blockedReason = isSlotBlockedByClosure(startTimeStr, endTimeStr);
      if (blockedReason) {
        status = "BLOCKED";
        bookingMeta = { blockedReason };
      } else if (bookingMap.has(timeKey)) {
        const bk = bookingMap.get(timeKey)!;
        status = "BOOKED";
        bookingMeta = {
          bookingId: bk.id,
          isOpenGame: Boolean(bk.isOpenGame),
          currentPlayers: bk.currentPlayersCount,
          maxPlayers: bk.maxPlayers,
        };
      } else if (isToday && timeKey < currentHourMin) {
        status = "PAST";
      }

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        status,
        ...bookingMeta,
      });

      startTotalMinutes += duration;
    }

    return { facility, date, slots };
  }

  // ---------------- Create Court Booking ----------------
  async createBooking(
    namespace: string,
    user: { id: string; fullName?: string; usn?: string },
    dto: CreateBookingDto,
  ): Promise<SportsBooking & { players: SportsBookingPlayer[] }> {
    const facility = await this.getFacilityById(namespace, dto.facilityId);

    // 0. Enforce 2-Day Advance Booking Limit (can only book up to 2 days)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const bookingDateObj = new Date(dto.bookingDate + "T00:00:00Z");
    const todayObj = new Date(todayStr + "T00:00:00Z");
    const diffDays = Math.round((bookingDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      throw new BadRequestException("Cannot book slots in the past.");
    }
    if (diffDays > 1) {
      throw new BadRequestException(
        "Booking limit: Courts can only be booked up to 2 days in advance (Today and Tomorrow).",
      );
    }

    // 1. Normalize time (e.g. "18:00" -> "18:00:00")
    const startTime = dto.startTime.length === 5 ? `${dto.startTime}:00` : dto.startTime;
    let endTime = dto.endTime;
    if (!endTime) {
      const [h, m] = startTime.split(":").map(Number);
      const endTotal = h * 60 + m + (facility.slotDurationMinutes || 60);
      endTime = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}:00`;
    } else if (endTime.length === 5) {
      endTime = `${endTime}:00`;
    }

    // 1.1 Check facility closure / call-off on this date
    const closures = await this.dataService.findClosuresForFacilityDate(
      namespace,
      dto.facilityId,
      dto.bookingDate,
    );
    for (const c of closures) {
      const cStart = c.startTime.slice(0, 5);
      const cEnd = c.endTime.slice(0, 5);
      const startKey = startTime.slice(0, 5);
      if (
        (cStart === "00:00" && cEnd >= "22:00") ||
        (startKey >= cStart && startKey < cEnd)
      ) {
        throw new BadRequestException(
          `Court bookings on ${dto.bookingDate} have been called off by administration: ${c.reason || "No bookings permitted."}`,
        );
      }
    }

    // 2. Prevent Double-Booking Conflict
    const conflict = await this.dataService.checkSlotConflict(
      namespace,
      dto.facilityId,
      dto.bookingDate,
      startTime,
    );
    if (conflict) {
      throw new ConflictException(
        `This court is already reserved for ${startTime.slice(0, 5)} on ${dto.bookingDate}`,
      );
    }

    // 3. Fair-play: limit active future bookings to 3
    const activeCount = await this.dataService.findUserActiveBookingsCount(
      namespace,
      user.id,
      new Date().toISOString().slice(0, 10),
    );
    if (activeCount >= 3) {
      throw new BadRequestException(
        "Fair play limit: You already have 3 active future bookings. Complete or cancel one first.",
      );
    }

    // 4. Generate unique 6-character code (e.g. BADM-4921)
    const sportPrefix = facility.sportType.slice(0, 4).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inviteCode = `${sportPrefix}-${randomSuffix}`;
    const hostQrToken = `sp_pass_${randomBytes(16).toString("hex")}`;

    const booking = new SportsBooking();
    booking.id = uuidv4();
    booking.campusId = namespace;
    booking.facilityId = facility.id;
    booking.userId = user.id;
    booking.userName = user.fullName || "Student Host";
    booking.userUsn = user.usn || null;
    booking.bookingDate = dto.bookingDate;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.status = BookingStatus.CONFIRMED;
    booking.inviteCode = inviteCode;
    booking.isOpenGame = dto.isOpenGame ? 1 : 0;
    booking.maxPlayers = dto.maxPlayers || facility.maxPlayers || 4;
    booking.currentPlayersCount = 1;
    booking.notes = dto.notes || null;
    booking.cancellationReason = null;
    booking.qrToken = hostQrToken;
    booking.createdBy = user.id;
    booking.updatedBy = user.id;

    const savedBooking = await this.dataService.saveBooking(namespace, booking);

    // 5. Create Host Player Entry
    const hostPlayer = new SportsBookingPlayer();
    hostPlayer.id = uuidv4();
    hostPlayer.campusId = namespace;
    hostPlayer.bookingId = savedBooking.id;
    hostPlayer.userId = user.id;
    hostPlayer.userName = user.fullName || "Student Host";
    hostPlayer.userUsn = user.usn || null;
    hostPlayer.role = PlayerRole.HOST;
    hostPlayer.qrToken = hostQrToken;
    hostPlayer.joinedAt = new Date();
    hostPlayer.createdBy = user.id;
    hostPlayer.updatedBy = user.id;

    const savedHostPlayer = await this.dataService.savePlayer(namespace, hostPlayer);
    const playersList: SportsBookingPlayer[] = [savedHostPlayer];

    // 6. If teammates were selected during booking, register them with individual QR passes
    if (dto.teammates && dto.teammates.length > 0) {
      for (const tm of dto.teammates) {
        if (!tm.userId || tm.userId === user.id) continue;
        const player = new SportsBookingPlayer();
        player.id = uuidv4();
        player.campusId = namespace;
        player.bookingId = savedBooking.id;
        player.userId = tm.userId;
        player.userName = tm.userName || "Teammate";
        player.userUsn = tm.userUsn || null;
        player.role = PlayerRole.PLAYER;
        player.qrToken = `sp_pass_${randomBytes(16).toString("hex")}`;
        player.joinedAt = new Date();
        player.createdBy = user.id;
        player.updatedBy = user.id;

        const savedPlayer = await this.dataService.savePlayer(namespace, player);
        playersList.push(savedPlayer);
      }

      savedBooking.currentPlayersCount = playersList.length;
      await this.dataService.saveBooking(namespace, savedBooking);
    }

    return {
      ...savedBooking,
      players: playersList,
    };
  }

  // ---------------- Join Game By Code ----------------
  async joinGameByCode(
    namespace: string,
    user: { id: string; fullName?: string; usn?: string },
    inviteCode: string,
  ): Promise<SportsBooking & { players: SportsBookingPlayer[] }> {
    const booking = await this.dataService.findBookingByInviteCode(
      namespace,
      inviteCode,
    );
    if (!booking) {
      throw new NotFoundException(`No game found with invitation code "${inviteCode}".`);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException("This court booking is cancelled or already completed.");
    }

    if (booking.currentPlayersCount >= booking.maxPlayers) {
      throw new BadRequestException("This match roster is already full.");
    }

    // Check if already a member
    const existingPlayer = await this.dataService.findPlayer(
      namespace,
      booking.id,
      user.id,
    );
    if (existingPlayer) {
      throw new ConflictException("You are already registered in this game!");
    }

    // Add Player with their own verified QR Token
    const playerQrToken = `sp_pass_${randomBytes(16).toString("hex")}`;
    const player = new SportsBookingPlayer();
    player.id = uuidv4();
    player.campusId = namespace;
    player.bookingId = booking.id;
    player.userId = user.id;
    player.userName = user.fullName || "Campus Teammate";
    player.userUsn = user.usn || null;
    player.role = PlayerRole.PLAYER;
    player.qrToken = playerQrToken;
    player.joinedAt = new Date();
    player.createdBy = user.id;
    player.updatedBy = user.id;

    await this.dataService.savePlayer(namespace, player);

    // Increment currentPlayersCount
    booking.currentPlayersCount += 1;
    const updatedBooking = await this.dataService.saveBooking(namespace, booking);
    const players = await this.dataService.findPlayersByBookingId(namespace, booking.id);

    return { ...updatedBooking, players };
  }

  // ---------------- Add Teammate Manually ----------------
  async addTeammate(
    namespace: string,
    hostUserId: string,
    bookingId: string,
    dto: AddTeammateDto,
  ): Promise<SportsBookingPlayer> {
    const booking = await this.dataService.findBookingById(namespace, bookingId);
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.userId !== hostUserId) {
      throw new ForbiddenException("Only the booking host can add teammates directly.");
    }
    if (booking.currentPlayersCount >= booking.maxPlayers) {
      throw new BadRequestException("Match roster is already full.");
    }

    const existingPlayer = await this.dataService.findPlayer(
      namespace,
      bookingId,
      dto.userId,
    );
    if (existingPlayer) {
      throw new ConflictException("Student is already in this team.");
    }

    const player = new SportsBookingPlayer();
    player.id = uuidv4();
    player.campusId = namespace;
    player.bookingId = booking.id;
    player.userId = dto.userId;
    player.userName = dto.userName;
    player.userUsn = dto.userUsn || null;
    player.role = PlayerRole.PLAYER;
    player.qrToken = `sp_pass_${randomBytes(16).toString("hex")}`;
    player.joinedAt = new Date();
    player.createdBy = hostUserId;
    player.updatedBy = hostUserId;

    const savedPlayer = await this.dataService.savePlayer(namespace, player);
    booking.currentPlayersCount += 1;
    await this.dataService.saveBooking(namespace, booking);

    return savedPlayer;
  }

  // ---------------- Get User's Bookings (Upcoming & Past) ----------------
  async getMyBookings(
    namespace: string,
    userId: string,
  ): Promise<Array<SportsBooking & { facilityName: string; sportType: string; venueType: string; location: string; myQrToken: string; myRole: PlayerRole; players: SportsBookingPlayer[] }>> {
    // 1. Get all player records for this user (both as host and teammate)
    const playerRecords = await this.dataService.findUserPlayerRecords(namespace, userId);
    if (!playerRecords.length) {
      return [];
    }

    const bookingIds = Array.from(new Set(playerRecords.map((p) => p.bookingId)));
    const bookings = await this.dataService.findBookingsByIds(namespace, bookingIds);

    // Map each booking with facility details and the specific user's QR pass
    const facilities = await this.dataService.findFacilities(namespace);
    const facilityMap = new Map(facilities.map((f) => [f.id, f]));

    const result = [];
    for (const bk of bookings) {
      const fac = facilityMap.get(bk.facilityId);
      const myPlayerRecord = playerRecords.find((p) => p.bookingId === bk.id);
      const allPlayers = await this.dataService.findPlayersByBookingId(namespace, bk.id);

      result.push({
        ...bk,
        facilityName: fac?.name || "Campus Court",
        sportType: fac?.sportType || "SPORTS",
        venueType: fac?.venueType || "INDOOR",
        location: fac?.location || "Campus Sports Area",
        myQrToken: myPlayerRecord?.qrToken || bk.qrToken,
        myRole: myPlayerRecord?.role || PlayerRole.PLAYER,
        players: allPlayers,
      });
    }

    return result;
  }

  // ---------------- Get Open Games ----------------
  async getOpenGames(
    namespace: string,
  ): Promise<Array<SportsBooking & { facilityName: string; sportType: string; venueType: string; location: string }>> {
    const today = new Date().toISOString().slice(0, 10);
    const openBookings = await this.dataService.findOpenGames(namespace, today);
    const facilities = await this.dataService.findFacilities(namespace);
    const facilityMap = new Map(facilities.map((f) => [f.id, f]));

    return openBookings.map((bk) => {
      const fac = facilityMap.get(bk.facilityId);
      return {
        ...bk,
        facilityName: fac?.name || "Campus Court",
        sportType: fac?.sportType || "SPORTS",
        venueType: fac?.venueType || "INDOOR",
        location: fac?.location || "Campus Sports Area",
      };
    });
  }

  // ---------------- Cancel Booking ----------------
  async cancelBooking(
    namespace: string,
    userId: string,
    bookingId: string,
    dto?: CancelBookingDto,
  ): Promise<SportsBooking> {
    const booking = await this.dataService.findBookingById(namespace, bookingId);
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException("Only the booking host can cancel this reservation.");
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException("Booking is already cancelled.");
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = dto?.reason || "Cancelled by student";
    booking.updatedBy = userId;

    return this.dataService.saveBooking(namespace, booking);
  }

  // ---------------- Admin: Create Facility ----------------
  async createFacility(
    namespace: string,
    dto: CreateFacilityDto,
    actorId: string,
  ): Promise<SportsFacility> {
    const facility = new SportsFacility();
    facility.id = uuidv4();
    facility.campusId = namespace;
    facility.name = dto.name;
    facility.sportType = dto.sportType;
    facility.venueType = dto.venueType;
    facility.location = dto.location;
    facility.description = dto.description || null;
    facility.rules = dto.rules || null;
    facility.openingTime = dto.openingTime || "06:00:00";
    facility.closingTime = dto.closingTime || "22:00:00";
    facility.slotDurationMinutes = dto.slotDurationMinutes || 60;
    facility.maxPlayers = dto.maxPlayers || 4;
    facility.isActive = 1;
    facility.createdBy = actorId;
    facility.updatedBy = actorId;

    return this.dataService.saveFacility(namespace, facility);
  }

  // ---------------- Admin: Call Off Day ----------------
  async callOffDay(
    namespace: string,
    dto: CallOffDayDto,
    actorId: string,
  ): Promise<{ message: string; closuresCount: number }> {
    const facilities =
      dto.facilityId === "ALL"
        ? await this.dataService.findFacilities(namespace)
        : [await this.getFacilityById(namespace, dto.facilityId)];

    if (!facilities.length) {
      throw new NotFoundException("No facilities found to call off.");
    }

    const startTime = dto.startTime
      ? dto.startTime.length === 5 ? `${dto.startTime}:00` : dto.startTime
      : "00:00:00";
    const endTime = dto.endTime
      ? dto.endTime.length === 5 ? `${dto.endTime}:00` : dto.endTime
      : "23:59:59";

    // Delete existing closure for this date first to avoid duplicates
    await this.dataService.deleteClosuresForFacilityDate(
      namespace,
      dto.facilityId,
      dto.closureDate,
    );

    for (const fac of facilities) {
      const closure = new SportsFacilityClosure();
      closure.id = uuidv4();
      closure.campusId = namespace;
      closure.facilityId = fac.id;
      closure.closureDate = dto.closureDate;
      closure.startTime = startTime;
      closure.endTime = endTime;
      closure.reason = dto.reason;
      closure.createdBy = actorId;
      closure.updatedBy = actorId;

      await this.dataService.saveClosure(namespace, closure);
    }

    return {
      message: `Bookings for ${dto.closureDate} called off successfully (${facilities.length} court(s)).`,
      closuresCount: facilities.length,
    };
  }

  // ---------------- Admin: Reopen Day ----------------
  async reopenDay(
    namespace: string,
    dto: ReopenDayDto,
    actorId: string,
  ): Promise<{ message: string; reopenedCount: number }> {
    const count = await this.dataService.deleteClosuresForFacilityDate(
      namespace,
      dto.facilityId,
      dto.closureDate,
    );
    return {
      message: `Bookings resumed successfully for ${dto.closureDate}.`,
      reopenedCount: count,
    };
  }

  // ---------------- Admin: Get Closures ----------------
  async getClosures(
    namespace: string,
    facilityId?: string,
    closureDate?: string,
  ): Promise<SportsFacilityClosure[]> {
    return this.dataService.findClosures(namespace, facilityId, closureDate);
  }

  // ---------------- Admin: Update Facility Timing ----------------
  async updateFacilityTiming(
    namespace: string,
    facilityId: string,
    dto: UpdateFacilityTimingDto,
    actorId: string,
  ): Promise<SportsFacility> {
    const facility = await this.getFacilityById(namespace, facilityId);

    if (dto.openingTime) {
      facility.openingTime =
        dto.openingTime.length === 5 ? `${dto.openingTime}:00` : dto.openingTime;
    }
    if (dto.closingTime) {
      facility.closingTime =
        dto.closingTime.length === 5 ? `${dto.closingTime}:00` : dto.closingTime;
    }
    if (dto.slotDurationMinutes) {
      facility.slotDurationMinutes = dto.slotDurationMinutes;
    }
    facility.updatedBy = actorId;

    return this.dataService.saveFacility(namespace, facility);
  }
}

