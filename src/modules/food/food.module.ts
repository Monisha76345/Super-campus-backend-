import { Module } from "@nestjs/common";
import { RedisModule } from "src/core/redis/redis.module";
import { TenantModule } from "src/core/tenant/tenant.module";
import { UserModule } from "src/modules/user/user.module";
import { FoodController } from "./controller/food.controller";
import { ChangePayClientService } from "./service/changepay-client.service";
import { FoodService } from "./service/food.service";

@Module({
  imports: [TenantModule, UserModule, RedisModule],
  controllers: [FoodController],
  providers: [ChangePayClientService, FoodService],
  exports: [FoodService],
})
export class FoodModule {}
