import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createConnection } from "mysql2/promise";
import { NamespaceDbConfig } from "src/config/database.config";

interface DatabaseConfig {
  namespaces: string[];
  getConnectionConfig: (namespace: string) => NamespaceDbConfig;
}

@Injectable()
export class RoleSchemaService implements OnModuleInit {
  private readonly logger = new Logger(RoleSchemaService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const database = this.config.get<DatabaseConfig>("database");
    if (!database?.namespaces?.length) {
      this.logger.warn("NAMESPACES is empty. Schema scripts were not applied.");
      return;
    }
    const statements = this.statements();
    for (const namespace of database.namespaces) {
      const cfg = database.getConnectionConfig(namespace);
      await this.apply(namespace, cfg, statements);
    }
  }

  private statements(): string[] {
    const candidates = [
      join(process.cwd(), "scripts/migrations"),
      join(__dirname, "../../../../scripts/migrations"),
    ];
    const directory = candidates.find((candidate) => {
      try {
        return readdirSync(candidate).some((name) => name.endsWith(".sql"));
      } catch {
        return false;
      }
    });
    if (!directory) {
      throw new Error("Migration folder was not found");
    }
    return readdirSync(directory)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .flatMap((name) => this.parse(readFileSync(join(directory, name), "utf8")));
  }

  private parse(sql: string): string[] {
    return sql
      .split(";")
      .map((statement) =>
        statement
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim(),
      )
      .filter(Boolean);
  }

  private async apply(namespace: string, cfg: NamespaceDbConfig, statements: string[]): Promise<void> {
    try {
      const connection = await createConnection({
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
        database: cfg.database,
        multipleStatements: false,
      });
      try {
        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (stmtError: any) {
            // 1060 = ER_DUP_FIELDNAME, 1061 = ER_DUP_KEYNAME, 1050 = ER_TABLE_EXISTS_ERROR
            if (
              stmtError?.errno === 1060 ||
              stmtError?.code === "ER_DUP_FIELDNAME" ||
              stmtError?.errno === 1061 ||
              stmtError?.code === "ER_DUP_KEYNAME" ||
              stmtError?.errno === 1050 ||
              stmtError?.code === "ER_TABLE_EXISTS_ERROR"
            ) {
              this.logger.debug(
                `Skipping already applied migration statement on ${namespace} (${stmtError.code || stmtError.errno}): ${stmtError.message}`,
              );
              continue;
            }
            throw stmtError;
          }
        }
      } finally {
        await connection.end();
      }
      this.logger.log(`Schema scripts are ready on ${cfg.database} (${namespace})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.error(`Schema scripts were not applied on ${namespace}: ${message}`);
    }
  }
}
