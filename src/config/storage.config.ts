import { registerAs } from "@nestjs/config";

export function normalizeEndpoint(urlOrHost: string): { host: string; port: number; useSSL: boolean } {
  const raw = (urlOrHost || "127.0.0.1").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const u = new URL(raw);
    return {
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : u.protocol === "https:" ? 443 : 9000,
      useSSL: u.protocol === "https:",
    };
  }
  const [host, portPart] = raw.split(":");
  return {
    host: host || "127.0.0.1",
    port: portPart ? parseInt(portPart, 10) : 9000,
    useSSL: false,
  };
}

export default registerAs("storage", () => {
  const parsed = normalizeEndpoint(process.env.MINIO_ENDPOINT || "127.0.0.1");
  const envPort = process.env.MINIO_PORT || "9000";
  return {
    endpoint: parsed.host,
    port: process.env.MINIO_PORT ? parseInt(envPort, 10) : parsed.port,
    useSSL: process.env.MINIO_USE_SSL === "true" || parsed.useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    bucket: process.env.MINIO_BUCKET || "supercampus-storage",
  };
});
