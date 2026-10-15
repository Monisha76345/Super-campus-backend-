import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Sends the code when SMTP is configured. Returns false when mail is not set up. */
  async sendOtp(to: string, otp: string): Promise<boolean> {
    const host = this.config.get<string>("SMTP_HOST")?.trim();
    if (!host) {
      return false;
    }
    try {
      const info = await this.client(host).sendMail({
        from: this.config.get<string>("SMTP_FROM")?.trim() || "noreply@supercampus.local",
        to,
        subject: "Supercampus verification code",
        text: `Your Supercampus verification code is ${otp}. It expires in 5 minutes.`,
      });
      this.logger.log(`OTP email queued for ${to} (${info.messageId})`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.error(`OTP email failed for ${to}: ${message}`);
      throw error;
    }
  }

  private client(host: string): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get<string>("SMTP_PORT") || "587", 10),
        secure: this.config.get<string>("SMTP_SECURE") === "true",
        auth: this.config.get<string>("SMTP_USER")
          ? {
              user: this.config.get<string>("SMTP_USER"),
              pass: this.config.get<string>("SMTP_PASS"),
            }
          : undefined,
      });
    }
    return this.transporter;
  }
}
