import { Global, Module } from "@nestjs/common";
import { DbClientService } from "./db-client.service";
import { TenantConnectionManager } from "./tenant-connection.manager";

@Global()
@Module({
  providers: [TenantConnectionManager, DbClientService],
  exports: [DbClientService, TenantConnectionManager],
})
export class DatabaseModule {}
