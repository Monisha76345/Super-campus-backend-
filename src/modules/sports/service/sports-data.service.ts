import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { SportsBooking } from "../entity/sports-booking.model";
import { SportsBookingPlayer } from "../entity/sports-booking-player.model";
import { SportsFacilityClosure } from "../entity/sports-facility-closure.model";
import { SportsFacility } from "../entity/sports-facility.model";
import { SportsRepository } from "../repository/sports.repository";

@Injectable()
export class SportsDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<SportsRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new SportsRepository(manager);
  }

  // Facilities
  async findFacilities(
    namespace: string,
    options?: { sportType?: string; venueType?: string; search?: string },
  ): Promise<SportsFacility[]> {
    return (await this.repo(namespace)).findFacilities(options);
  }

  async findFacilityById(namespace: string, id: string): Promise<SportsFacility | null> {
    return (await this.repo(namespace)).findFacilityById(id);
  }

  async saveFacility(namespace: string, facility: SportsFacility): Promise<SportsFacility> {
    return (await this.repo(namespace)).saveFacility(facility);
  }

  // Bookings
  async findBookingById(namespace: string, id: string): Promise<SportsBooking | null> {
    return (await this.repo(namespace)).findBookingById(id);
  }

  async findBookingByInviteCode(
    namespace: string,
    inviteCode: string,
  ): Promise<SportsBooking | null> {
    return (await this.repo(namespace)).findBookingByInviteCode(inviteCode);
  }

  async findActiveBookingsForFacilityDate(
    namespace: string,
    facilityId: string,
    bookingDate: string,
  ): Promise<SportsBooking[]> {
    return (await this.repo(namespace)).findActiveBookingsForFacilityDate(
      facilityId,
      bookingDate,
    );
  }

  async checkSlotConflict(
    namespace: string,
    facilityId: string,
    bookingDate: string,
    startTime: string,
  ): Promise<SportsBooking | null> {
    return (await this.repo(namespace)).checkSlotConflict(
      facilityId,
      bookingDate,
      startTime,
    );
  }

  async findUserActiveBookingsCount(
    namespace: string,
    userId: string,
    bookingDate: string,
  ): Promise<number> {
    return (await this.repo(namespace)).findUserActiveBookingsCount(userId, bookingDate);
  }

  async findBookingsByIds(namespace: string, ids: string[]): Promise<SportsBooking[]> {
    return (await this.repo(namespace)).findBookingsByIds(ids);
  }

  async findOpenGames(namespace: string, bookingDate?: string): Promise<SportsBooking[]> {
    return (await this.repo(namespace)).findOpenGames(bookingDate);
  }

  async saveBooking(namespace: string, booking: SportsBooking): Promise<SportsBooking> {
    return (await this.repo(namespace)).saveBooking(booking);
  }

  // Players
  async findPlayersByBookingId(
    namespace: string,
    bookingId: string,
  ): Promise<SportsBookingPlayer[]> {
    return (await this.repo(namespace)).findPlayersByBookingId(bookingId);
  }

  async findPlayer(
    namespace: string,
    bookingId: string,
    userId: string,
  ): Promise<SportsBookingPlayer | null> {
    return (await this.repo(namespace)).findPlayer(bookingId, userId);
  }

  async findUserPlayerRecords(
    namespace: string,
    userId: string,
  ): Promise<SportsBookingPlayer[]> {
    return (await this.repo(namespace)).findUserPlayerRecords(userId);
  }

  async savePlayer(
    namespace: string,
    player: SportsBookingPlayer,
  ): Promise<SportsBookingPlayer> {
    return (await this.repo(namespace)).savePlayer(player);
  }

  // Closures
  async findClosuresForFacilityDate(
    namespace: string,
    facilityId: string,
    closureDate: string,
  ): Promise<SportsFacilityClosure[]> {
    return (await this.repo(namespace)).findClosuresForFacilityDate(
      facilityId,
      closureDate,
    );
  }

  async saveClosure(
    namespace: string,
    closure: SportsFacilityClosure,
  ): Promise<SportsFacilityClosure> {
    return (await this.repo(namespace)).saveClosure(closure);
  }
}
