import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { UserModule } from "src/modules/user/user.module";
import { OutpassController } from "./controller/outpass.controller";
import { OutpassRequest } from "./entity/outpass.model";
import { OutpassDataService } from "./service/outpass-data.service";
import { OutpassService } from "./service/outpass.service";
import { SmsNotificationService } from "./service/sms-notification.service";

@Module({
  imports: [UserModule],
  controllers: [OutpassController],
  providers: [OutpassDataService, OutpassService, SmsNotificationService],
  exports: [OutpassService, SmsNotificationService],
})
export class OutpassModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([OutpassRequest]);
  }
}
