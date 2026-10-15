import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Campus mail domain, for example nmit → nmit.ac.in. */
export function collegeEmailDomain(config: ConfigService, tenantId: string): string {
  const configured = config
    .get<string>(`${tenantId.toUpperCase()}_EMAIL_DOMAIN`)
    ?.trim()
    .toLowerCase()
    .replace(/^@/, "");
  if (configured) {
    return configured;
  }
  if (tenantId.toLowerCase() === "nmit") {
    return "nmit.ac.in";
  }
  throw new BadRequestException(`College email domain is not configured for ${tenantId}`);
}

export function isCollegeEmail(email: string, domain: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

/** Digits only, 10 to 15 characters. Returns null when the value is not a mobile number. */
export function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return digits;
}
