import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Connection, createConnection, RowDataPacket } from "mysql2/promise";
import { NamespaceDbConfig } from "src/config/database.config";

interface DatabaseConfig {
  namespaces: string[];
  getConnectionConfig: (namespace: string) => NamespaceDbConfig;
}

interface MigrationFile {
  name: string;
  statements: string[];
}

const MIGRATIONS_TABLE = "_schema_migrations";

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
    const migrations = this.migrations();
    for (const namespace of database.namespaces) {
      const cfg = database.getConnectionConfig(namespace);
      await this.apply(namespace, cfg, migrations);
    }
  }

  private migrations(): MigrationFile[] {
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
      .map((name) => ({
        name,
        statements: this.parse(readFileSync(join(directory, name), "utf8")),
      }))
      .filter((migration) => migration.statements.length > 0);
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

  private async apply(
    namespace: string,
    cfg: NamespaceDbConfig,
    migrations: MigrationFile[],
  ): Promise<void> {
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
        await this.ensureMigrationsTable(connection);
        const applied = await this.appliedMigrations(connection);
        let ran = 0;

        for (const migration of migrations) {
          if (applied.has(migration.name)) {
            continue;
          }
          for (const statement of migration.statements) {
            await this.runStatement(connection, statement);
          }
          await connection.query(
            `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`name\`, \`appliedAt\`) VALUES (?, CURRENT_TIMESTAMP(6))`,
            [migration.name],
          );
          ran += 1;
        }

        if (ran > 0) {
          this.logger.log(
            `Applied ${ran} schema migration(s) on ${cfg.database} (${namespace})`,
          );
        } else {
          this.logger.log(`Schema scripts are ready on ${cfg.database} (${namespace})`);
        }
      } finally {
        await connection.end();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.error(`Schema scripts were not applied on ${namespace}: ${message}`);
    }
  }

  private async ensureMigrationsTable(connection: Connection): Promise<void> {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
        \`name\` varchar(255) NOT NULL,
        \`appliedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  private async appliedMigrations(connection: Connection): Promise<Set<string>> {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT \`name\` FROM \`${MIGRATIONS_TABLE}\``,
    );
    return new Set(rows.map((row) => String(row.name)));
  }

  private async runStatement(connection: Connection, statement: string): Promise<void> {
    try {
      await connection.query(statement);
    } catch (stmtError: any) {
      // 1060 = ER_DUP_FIELDNAME, 1061 = ER_DUP_KEYNAME, 1050 = ER_TABLE_EXISTS_ERROR
      // Expected when an older ALTER is applied to a table that already has the change.
      if (
        stmtError?.errno === 1060 ||
        stmtError?.code === "ER_DUP_FIELDNAME" ||
        stmtError?.errno === 1061 ||
        stmtError?.code === "ER_DUP_KEYNAME" ||
        stmtError?.errno === 1050 ||
        stmtError?.code === "ER_TABLE_EXISTS_ERROR"
      ) {
        return;
      }
      throw stmtError;
    }
  }
}
