import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import redisConfig from "../../config/redis.config";
import { OtpService } from "./otp.service";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisService, OtpService],
  exports: [RedisService, OtpService],
})
export class RedisModule {}
