import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { TenantModule } from "src/core/tenant/tenant.module";
import { CommunityController } from "./controller/community.controller";
import { CommunityPost } from "./entity/community-post.model";
import { CommunityDataService } from "./service/community-data.service";
import { CommunityService } from "./service/community.service";

@Module({
  imports: [TenantModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityDataService],
  exports: [CommunityService],
})
export class CommunityModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([CommunityPost]);
  }
}
