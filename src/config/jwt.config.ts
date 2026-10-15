import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "change-me",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
}));
