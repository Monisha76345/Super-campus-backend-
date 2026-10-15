import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { NamespaceDbConfig } from "../../config/database.config";
import { registeredEntities } from "./entities.registry";

@Injectable()
export class TenantConnectionManager {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private readonly connections = new Map<string, DataSource>();

  constructor(private readonly config: ConfigService) {}

  async getDataSource(namespace: string): Promise<DataSource> {
    const existing = this.connections.get(namespace);
    if (existing?.isInitialized) {
      return existing;
    }
    const database = this.config.get<{ getConnectionConfig: (ns: string) => NamespaceDbConfig }>("database");
    if (!database) {
      throw new Error("Database config is not loaded");
    }
    const cfg = database.getConnectionConfig(namespace);
    const dataSource = new DataSource({
      type: "mysql",
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      database: cfg.database,
      entities: registeredEntities,
      synchronize: cfg.synchronize,
      charset: "utf8mb4",
    });
    await dataSource.initialize();
    this.connections.set(namespace, dataSource);
    this.logger.log(`Connected campus database ${cfg.database} (${namespace})`);
    return dataSource;
  }
}
