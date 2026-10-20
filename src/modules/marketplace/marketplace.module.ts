import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { MarketplaceController } from "./controller/marketplace.controller";
import { MarketplaceItem } from "./entity/marketplace-item.model";
import { MarketplaceItemLike } from "./entity/marketplace-like.model";
import { MarketplaceDataService } from "./service/marketplace-data.service";
import { MarketplaceService } from "./service/marketplace.service";

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceDataService, MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([MarketplaceItem, MarketplaceItemLike]);
  }
}
