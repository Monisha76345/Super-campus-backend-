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
  CancelBookingDto,
  CreateBookingDto,
  CreateFacilityDto,
  QueryFacilitiesDto,
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

    const closureMap = new Set<string>();
    for (const c of closures) {
      closureMap.add(c.startTime.slice(0, 5));
    }

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

      if (closureMap.has(timeKey)) {
        status = "BLOCKED";
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
}
