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
    const user = (this.config.get<string>("SMTP_USER") || this.config.get<string>("SMTP_USERNAME"))?.trim();
    const from =
      this.config.get<string>("SMTP_FROM")?.trim() ||
      (user ? `Supercampus <${user}>` : "noreply@supercampus.io");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080B11; padding: 32px 16px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #0F172A; border-radius: 18px; padding: 32px; border: 1px solid #1E293B; text-align: center;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 22px; font-weight: 800; color: #38BDF8; letter-spacing: -0.5px;">Supercampus</span>
          </div>
          <h2 style="color: #F8FAFC; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">Password Reset Code</h2>
          <p style="color: #94A3B8; font-size: 14px; margin: 0 0 24px 0; line-height: 22px;">
            Use the 6-digit verification code below to reset your campus account password.
          </p>
          <div style="background-color: #111827; border: 1.5px solid #2563EB; border-radius: 12px; padding: 18px 24px; margin: 0 auto 24px auto; display: inline-block;">
            <span style="font-family: monospace, Courier; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8;">${otp}</span>
          </div>
          <p style="color: #64748B; font-size: 13px; margin: 0; line-height: 20px;">
            This code will expire in <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.client(host).sendMail({
        from,
        to,
        subject: `${otp} is your Supercampus verification code`,
        text: `Your Supercampus verification code is ${otp}. It expires in 5 minutes.`,
        html,
      });
      this.logger.log(`OTP email sent successfully to ${to} (${info.messageId})`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.error(`OTP email failed for ${to}: ${message}`);
      throw error;
    }
  }

  private client(host: string): Transporter {
    const user = (this.config.get<string>("SMTP_USER") || this.config.get<string>("SMTP_USERNAME"))?.trim();
    const pass = (this.config.get<string>("SMTP_PASS") || this.config.get<string>("SMTP_PASSWORD"))?.trim();

    return nodemailer.createTransport({
      host,
      port: parseInt(this.config.get<string>("SMTP_PORT") || "587", 10),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      auth: user && pass ? { user, pass } : undefined,
    });
  }
}
