import { randomBytes, randomInt } from "crypto";
import { Injectable } from "@nestjs/common";
import { RedisService } from "./redis.service";

const OTP_TTL_SECONDS = 300;
const TOKEN_TTL_SECONDS = 900;
const MAX_ATTEMPTS = 5;

interface OtpRecord {
  otp: string;
  attempts: number;
  personalEmail?: string;
}

export interface ActivationClaim {
  tenantId: string;
  directoryId: string;
  email: string;
}

export interface PasswordResetClaim {
  tenantId: string;
  userId: string;
  directoryId: string;
  email: string;
}

@Injectable()
export class OtpService {
  constructor(private readonly redis: RedisService) {}

  async issue(key: string, personalEmail?: string): Promise<string> {
    const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const record: OtpRecord = { otp, attempts: 0, personalEmail };
    await this.redis.set(this.otpKey(key), record, OTP_TTL_SECONDS);
    return otp;
  }

  async check(key: string, otp: string, personalEmail?: string): Promise<boolean> {
    const record = await this.redis.get<OtpRecord>(this.otpKey(key));
    if (!record) {
      return false;
    }
    if (personalEmail && record.personalEmail && record.personalEmail !== personalEmail) {
      return false;
    }
    if (record.otp !== otp) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        await this.redis.del(this.otpKey(key));
      } else {
        await this.redis.set(this.otpKey(key), record, OTP_TTL_SECONDS);
      }
      return false;
    }
    await this.redis.del(this.otpKey(key));
    return true;
  }

  async saveActivation(claim: ActivationClaim): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await this.redis.set(this.activationKey(token), claim, TOKEN_TTL_SECONDS);
    return token;
  }

  async takeActivation(token: string): Promise<ActivationClaim | null> {
    const claim = await this.redis.get<ActivationClaim>(this.activationKey(token));
    if (!claim) {
      return null;
    }
    await this.redis.del(this.activationKey(token));
    return claim;
  }

  async savePasswordReset(claim: PasswordResetClaim): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await this.redis.set(this.resetKey(token), claim, TOKEN_TTL_SECONDS);
    return token;
  }

  async takePasswordReset(token: string): Promise<PasswordResetClaim | null> {
    const claim = await this.redis.get<PasswordResetClaim>(this.resetKey(token));
    if (!claim) {
      return null;
    }
    await this.redis.del(this.resetKey(token));
    return claim;
  }

  private otpKey(key: string): string {
    return `otp:${key}`;
  }

  private activationKey(token: string): string {
    return `activate:${token}`;
  }

  private resetKey(token: string): string {
    return `reset:${token}`;
  }
}
