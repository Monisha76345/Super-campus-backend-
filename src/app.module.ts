import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { DocumentUploaderModule } from "./common/document-uploader/document-uploader.module";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import storageConfig from "./config/storage.config";
import { AuditContextInterceptor } from "./core/audit/audit-context.interceptor";
import { AuthModule } from "./core/auth/auth.module";
import { JwtAuthGuard } from "./core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./core/auth/guards/roles.guard";
import { DatabaseModule } from "./core/database/database.module";
import { MailModule } from "./core/mail/mail.module";
import { RedisModule } from "./core/redis/redis.module";
import { TenantMiddleware } from "./core/tenant/tenant.middleware";
import { TenantModule } from "./core/tenant/tenant.module";

import { OutpassModule } from "./modules/outpass/outpass.module";
import { ProjectModule } from "./modules/project/project.module";
import { ChatModule } from "./modules/chat/chat.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      load: [databaseConfig, jwtConfig, storageConfig],
    }),
    TenantModule,
    DatabaseModule,
    RedisModule,
    MailModule,
    AuthModule,
    DocumentUploaderModule,
    OutpassModule,
    ProjectModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
