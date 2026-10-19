import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { ChatController } from "./controller/chat.controller";
import { ChatService } from "./service/chat.service";
import { ChatDataService } from "./service/chat-data.service";
import { ChatThread } from "./entity/chat-thread.model";
import { ChatParticipant } from "./entity/chat-participant.model";
import { ChatMessage } from "./entity/chat-message.model";
import { TenantModule } from "src/core/tenant/tenant.module";

@Module({
  imports: [TenantModule],
  controllers: [ChatController],
  providers: [ChatService, ChatDataService],
  exports: [ChatService],
})
export class ChatModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([ChatThread, ChatParticipant, ChatMessage]);
  }
}
