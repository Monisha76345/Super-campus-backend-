import { registerAs } from "@nestjs/config";

export interface NamespaceDbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
}

function parseNamespaceConfig(env: NodeJS.ProcessEnv) {
  const environment = env.ENVIRONMENT || env.NODE_ENV?.toUpperCase() || "LOCAL";
  const configuredNamespaces = (env.NAMESPACES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const namespaces = configuredNamespaces.length
    ? configuredNamespaces
    : env.DB_DATABASE
      ? ["default"]
      : [];

  const sharedHost = env.DB_HOST || "127.0.0.1";
  const sharedPort = parseInt(env.DB_PORT || "3306", 10);
  const sharedUsername = env.DB_USERNAME || "root";
  const sharedPassword = env.DB_PASSWORD || "";

  function getKey(namespace: string, key: string): string | undefined {
    return env[`${namespace}.${environment}.${key}`];
  }

  function getConnectionConfig(namespace: string): NamespaceDbConfig {
    const database =
      getKey(namespace, "DB_DATABASE") ??
      env.DB_DATABASE ??
      `${env.DB_DATABASE_PREFIX || "campus_db_"}${namespace}`;
    const synchronizeRaw = getKey(namespace, "DB_SYNCHRONIZE") ?? env.DB_SYNCHRONIZE;
    return {
      host: getKey(namespace, "DB_HOST") ?? sharedHost,
      port: parseInt(getKey(namespace, "DB_PORT") ?? String(sharedPort), 10),
      username: getKey(namespace, "DB_USERNAME") ?? sharedUsername,
      password: getKey(namespace, "DB_PASSWORD") ?? sharedPassword,
      database,
      synchronize: synchronizeRaw === "true",
    };
  }

  return { environment, namespaces, getConnectionConfig };
}

export default registerAs("database", () => parseNamespaceConfig(process.env));
