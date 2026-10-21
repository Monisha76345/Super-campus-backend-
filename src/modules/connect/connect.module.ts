import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { ConnectController } from "./controller/connect.controller";
import { CampusEvent } from "./entity/campus-event.model";
import { CampusClub } from "./entity/campus-club.model";
import { CampusOpportunity } from "./entity/campus-opportunity.model";
import { CampusConnection } from "./entity/campus-connection.model";
import { ConnectDataService } from "./service/connect-data.service";
import { ConnectService } from "./service/connect.service";

@Module({
  controllers: [ConnectController],
  providers: [ConnectDataService, ConnectService],
  exports: [ConnectService],
})
export class ConnectModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([CampusEvent, CampusClub, CampusOpportunity, CampusConnection]);
  }
}
