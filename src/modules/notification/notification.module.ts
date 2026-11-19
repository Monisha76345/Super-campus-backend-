import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { UserModule } from "src/modules/user/user.module";
import { NotificationController } from "./controller/notification.controller";
import { DeviceToken } from "./entity/device-token.model";
import { AppNotification } from "./entity/notification.model";
import { NotificationPreference } from "./entity/notification-preference.model";
import { ExpoPushService } from "./service/expo-push.service";
import { NotificationDataService } from "./service/notification-data.service";
import { NotificationService } from "./service/notification.service";

@Module({
  imports: [UserModule],
  controllers: [NotificationController],
  providers: [NotificationDataService, NotificationService, ExpoPushService],
  exports: [NotificationService],
})
export class NotificationModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([AppNotification, DeviceToken, NotificationPreference]);
  }
}
