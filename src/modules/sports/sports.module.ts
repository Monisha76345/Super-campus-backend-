import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { TenantModule } from "src/core/tenant/tenant.module";
import { SportsController } from "./controller/sports.controller";
import { SportsBooking } from "./entity/sports-booking.model";
import { SportsBookingPlayer } from "./entity/sports-booking-player.model";
import { SportsFacilityClosure } from "./entity/sports-facility-closure.model";
import { SportsFacility } from "./entity/sports-facility.model";
import { SportsDataService } from "./service/sports-data.service";
import { SportsService } from "./service/sports.service";

@Module({
  imports: [TenantModule],
  controllers: [SportsController],
  providers: [SportsService, SportsDataService],
  exports: [SportsService],
})
export class SportsModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([
      SportsFacility,
      SportsBooking,
      SportsBookingPlayer,
      SportsFacilityClosure,
    ]);
  }
}
