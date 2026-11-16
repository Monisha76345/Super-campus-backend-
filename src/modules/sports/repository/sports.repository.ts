import { EntityManager } from "typeorm";
import { BookingStatus } from "../entity/enums/booking-status.enum";
import { SportsBooking } from "../entity/sports-booking.model";
import { SportsBookingPlayer } from "../entity/sports-booking-player.model";
import { SportsFacilityClosure } from "../entity/sports-facility-closure.model";
import { SportsFacility } from "../entity/sports-facility.model";

export class SportsRepository {
  constructor(private readonly manager: EntityManager) {}

  // ---------------- Facilities ----------------
  async findFacilities(options?: {
    sportType?: string;
    venueType?: string;
    search?: string;
  }): Promise<SportsFacility[]> {
    const qb = this.manager
      .getRepository(SportsFacility)
      .createQueryBuilder("fac")
      .where("fac.isActive = 1");

    if (options?.sportType && options.sportType.toUpperCase() !== "ALL") {
      qb.andWhere("fac.sportType = :sportType", {
        sportType: options.sportType.toUpperCase(),
      });
    }

    if (options?.venueType && options.venueType.toUpperCase() !== "ALL") {
      qb.andWhere("fac.venueType = :venueType", {
        venueType: options.venueType.toUpperCase(),
      });
    }

    if (options?.search && options.search.trim()) {
      qb.andWhere(
        "(fac.name LIKE :search OR fac.location LIKE :search OR fac.sportType LIKE :search)",
        { search: `%${options.search.trim()}%` },
      );
    }

    return qb.orderBy("fac.name", "ASC").getMany();
  }

  async findFacilityById(id: string): Promise<SportsFacility | null> {
    return this.manager.getRepository(SportsFacility).findOne({
      where: { id, isActive: 1 },
    });
  }

  async saveFacility(facility: SportsFacility): Promise<SportsFacility> {
    return this.manager.getRepository(SportsFacility).save(facility);
  }

  // ---------------- Bookings ----------------
  async findBookingById(id: string): Promise<SportsBooking | null> {
    return this.manager.getRepository(SportsBooking).findOne({
      where: { id },
    });
  }

  async findBookingByInviteCode(inviteCode: string): Promise<SportsBooking | null> {
    return this.manager.getRepository(SportsBooking).findOne({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
    });
  }

  async findActiveBookingsForFacilityDate(
    facilityId: string,
    bookingDate: string,
  ): Promise<SportsBooking[]> {
    return this.manager
      .getRepository(SportsBooking)
      .createQueryBuilder("bk")
      .where("bk.facilityId = :facilityId", { facilityId })
      .andWhere("bk.bookingDate = :bookingDate", { bookingDate })
      .andWhere("bk.status = :status", { status: BookingStatus.CONFIRMED })
      .getMany();
  }

  async checkSlotConflict(
    facilityId: string,
    bookingDate: string,
    startTime: string,
  ): Promise<SportsBooking | null> {
    return this.manager
      .getRepository(SportsBooking)
      .createQueryBuilder("bk")
      .where("bk.facilityId = :facilityId", { facilityId })
      .andWhere("bk.bookingDate = :bookingDate", { bookingDate })
      .andWhere("bk.startTime = :startTime", { startTime })
      .andWhere("bk.status = :status", { status: BookingStatus.CONFIRMED })
      .getOne();
  }

  async findUserActiveBookingsCount(
    userId: string,
    bookingDate: string,
  ): Promise<number> {
    return this.manager
      .getRepository(SportsBooking)
      .createQueryBuilder("bk")
      .where("bk.userId = :userId", { userId })
      .andWhere("bk.bookingDate >= :bookingDate", { bookingDate })
      .andWhere("bk.status = :status", { status: BookingStatus.CONFIRMED })
      .getCount();
  }

  async findBookingsByIds(ids: string[]): Promise<SportsBooking[]> {
    if (!ids.length) return [];
    return this.manager
      .getRepository(SportsBooking)
      .createQueryBuilder("bk")
      .where("bk.id IN (:...ids)", { ids })
      .orderBy("bk.bookingDate", "ASC")
      .addOrderBy("bk.startTime", "ASC")
      .getMany();
  }

  async findOpenGames(bookingDate?: string): Promise<SportsBooking[]> {
    const qb = this.manager
      .getRepository(SportsBooking)
      .createQueryBuilder("bk")
      .where("bk.isOpenGame = 1")
      .andWhere("bk.status = :status", { status: BookingStatus.CONFIRMED })
      .andWhere("bk.currentPlayersCount < bk.maxPlayers");

    if (bookingDate) {
      qb.andWhere("bk.bookingDate >= :bookingDate", { bookingDate });
    }

    return qb
      .orderBy("bk.bookingDate", "ASC")
      .addOrderBy("bk.startTime", "ASC")
      .getMany();
  }

  async saveBooking(booking: SportsBooking): Promise<SportsBooking> {
    return this.manager.getRepository(SportsBooking).save(booking);
  }

  // ---------------- Players ----------------
  async findPlayersByBookingId(bookingId: string): Promise<SportsBookingPlayer[]> {
    return this.manager
      .getRepository(SportsBookingPlayer)
      .createQueryBuilder("p")
      .where("p.bookingId = :bookingId", { bookingId })
      .orderBy("p.role", "ASC")
      .addOrderBy("p.joinedAt", "ASC")
      .getMany();
  }

  async findPlayer(
    bookingId: string,
    userId: string,
  ): Promise<SportsBookingPlayer | null> {
    return this.manager.getRepository(SportsBookingPlayer).findOne({
      where: { bookingId, userId },
    });
  }

  async findUserPlayerRecords(userId: string): Promise<SportsBookingPlayer[]> {
    return this.manager
      .getRepository(SportsBookingPlayer)
      .createQueryBuilder("p")
      .where("p.userId = :userId", { userId })
      .getMany();
  }

  async savePlayer(player: SportsBookingPlayer): Promise<SportsBookingPlayer> {
    return this.manager.getRepository(SportsBookingPlayer).save(player);
  }

  // ---------------- Closures ----------------
  async findClosuresForFacilityDate(
    facilityId: string,
    closureDate: string,
  ): Promise<SportsFacilityClosure[]> {
    return this.manager
      .getRepository(SportsFacilityClosure)
      .createQueryBuilder("c")
      .where("c.facilityId = :facilityId", { facilityId })
      .andWhere("c.closureDate = :closureDate", { closureDate })
      .getMany();
  }

  async saveClosure(closure: SportsFacilityClosure): Promise<SportsFacilityClosure> {
    return this.manager.getRepository(SportsFacilityClosure).save(closure);
  }

  async findClosures(
    facilityId?: string,
    closureDate?: string,
  ): Promise<SportsFacilityClosure[]> {
    const qb = this.manager
      .getRepository(SportsFacilityClosure)
      .createQueryBuilder("c");

    if (facilityId && facilityId !== "ALL") {
      qb.andWhere("c.facilityId = :facilityId", { facilityId });
    }
    if (closureDate) {
      qb.andWhere("c.closureDate = :closureDate", { closureDate });
    }

    return qb.orderBy("c.closureDate", "ASC").getMany();
  }

  async deleteClosuresForFacilityDate(
    facilityId: string,
    closureDate: string,
  ): Promise<number> {
    const qb = this.manager
      .getRepository(SportsFacilityClosure)
      .createQueryBuilder()
      .delete()
      .from(SportsFacilityClosure)
      .where("closureDate = :closureDate", { closureDate });

    if (facilityId !== "ALL") {
      qb.andWhere("facilityId = :facilityId", { facilityId });
    }

    const result = await qb.execute();
    return result.affected || 0;
  }
}

