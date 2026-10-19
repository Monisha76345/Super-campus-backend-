import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  provider: "MOBILE_ONE" | "FAST2SMS" | "TWILIO" | "CONSOLE_LOGGER";
  text: string;
  recipient: string;
}

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Dispatches automated exit SMS to parent when student scans out at hostel gate.
   */
  async sendExitAlert(params: {
    parentPhone: string;
    studentName: string;
    usn?: string | null;
    destination: string;
    exitTime: Date;
    expectedReturnTime: Date;
    campusName?: string;
  }): Promise<SendSmsResult> {
    const formattedExit = this.formatTime(params.exitTime);
    const formattedReturn = this.formatTime(params.expectedReturnTime);
    const campus = params.campusName || "NMIT";

    const text =
      `Dear Parent, your ward ${params.studentName}${params.usn ? ` (${params.usn})` : ""} ` +
      `has checked OUT of ${campus} Hostel at ${formattedExit}. ` +
      `Destination: ${params.destination}. Expected Return: ${formattedReturn}. - ${campus} Hostel Admin`;

    return this.dispatchSms(params.parentPhone, text);
  }

  /**
   * Dispatches automated entry SMS to parent when student scans back into hostel.
   */
  async sendEntryAlert(params: {
    parentPhone: string;
    studentName: string;
    usn?: string | null;
    entryTime: Date;
    isOverdue: boolean;
    campusName?: string;
  }): Promise<SendSmsResult> {
    const formattedEntry = this.formatTime(params.entryTime);
    const campus = params.campusName || "NMIT";

    const text = params.isOverdue
      ? `ALERT: Your ward ${params.studentName}${params.usn ? ` (${params.usn})` : ""} ` +
        `has returned LATE to ${campus} Hostel at ${formattedEntry} (Past curfew). - ${campus} Hostel Admin`
      : `Dear Parent, your ward ${params.studentName}${params.usn ? ` (${params.usn})` : ""} ` +
        `has safely checked back IN to ${campus} Hostel at ${formattedEntry}. - ${campus} Hostel Admin`;

    return this.dispatchSms(params.parentPhone, text);
  }

  /**
   * Dispatches SMS via configured provider (Karnataka MobileOne from CAS, Fast2SMS, or Console Logger).
   */
  private async dispatchSms(phoneNumber: string, text: string): Promise<SendSmsResult> {
    const cleanedNumber = phoneNumber.replace(/\s+/g, "").trim();
    const digitsOnly = cleanedNumber.replace(/\D/g, "");
    const recipient10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

    // Visual formatting box in server logs
    this.logger.log(
      `\n================= [PARENT SMS DISPATCH INITIATED] =================\n` +
      `RECIPIENT (PARENT PHONE) : ${cleanedNumber} (10-digit: ${recipient10})\n` +
      `MESSAGE                  : ${text}\n` +
      `==================================================================\n`
    );

    // 1. Karnataka MobileOne SMS Gateway (from CAS project)
    const mobileOneUrl =
      this.config.get<string>("SMS_API_URL") ||
      "http://smsmobileone.karnataka.gov.in/index.php/sendmsg";
    const username = this.config.get<string>("SMS_USERNAME");
    const password = this.config.get<string>("SMS_PASSWORD");
    const secureKey = this.config.get<string>("SMS_SECURE_KEY");
    const senderId = this.config.get<string>("SMS_SENDER_ID") || "BDAGOV";

    if (username && password && secureKey && recipient10.length === 10) {
      try {
        const encryptedPassword = this.encryptPasswordSha1(password);
        const hashKey = this.generateSmsHashKey(username, senderId, text, secureKey);

        const form = new URLSearchParams();
        form.append("mobileno", recipient10);
        form.append("senderid", senderId);
        form.append("content", text);
        form.append("smsservicetype", "singlemsg");
        form.append("username", username);
        form.append("password", encryptedPassword);
        form.append("key", hashKey);
        form.append("templateid", "");

        const started = Date.now();
        const res = await fetch(mobileOneUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        const rawResponse = await res.text();
        const duration = Date.now() - started;
        this.logger.log(`[MobileOne Gateway] Response in ${duration}ms: ${rawResponse}`);

        const isSuccess = rawResponse.includes("402") || rawResponse.includes("MsgID");
        const msgIdMatch = rawResponse.match(/MsgID\s*=\s*([^\s,]+)/i);

        if (isSuccess) {
          this.logger.log(`[MobileOne Gateway] SUCCESS! Message ID: ${msgIdMatch?.[1] || "Delivered"}`);
          return {
            success: true,
            provider: "MOBILE_ONE",
            messageId: msgIdMatch?.[1],
            text,
            recipient: recipient10,
          };
        } else {
          this.logger.warn(`[MobileOne Gateway] Returned non-success code: ${rawResponse}`);
        }
      } catch (err: unknown) {
        this.logger.error(`[MobileOne Gateway] Dispatch error: ${(err as Error).message}`);
      }
    }

    // 2. Fast2SMS Provider (if FAST2SMS_API_KEY is configured)
    const fast2smsKey = this.config.get<string>("FAST2SMS_API_KEY");
    if (fast2smsKey && recipient10.length === 10) {
      try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "v3",
            sender_id: "TXTIND",
            message: text,
            language: "english",
            flash: 0,
            numbers: recipient10,
          }),
        });
        const data = await response.json();
        this.logger.log(`Fast2SMS HTTP Response: ${JSON.stringify(data)}`);
        return {
          success: true,
          provider: "FAST2SMS",
          text,
          recipient: recipient10,
        };
      } catch (err: unknown) {
        this.logger.error(`Fast2SMS dispatch error: ${(err as Error).message}`);
      }
    }

    // 3. Fallback Development Simulator
    return {
      success: true,
      provider: "CONSOLE_LOGGER",
      text,
      recipient: cleanedNumber,
    };
  }

  private encryptPasswordSha1(password: string): string {
    const hash = crypto.createHash("sha1");
    hash.update(password, "latin1");
    return hash.digest("hex");
  }

  private generateSmsHashKey(
    username: string,
    senderId: string,
    content: string,
    secureKey: string,
  ): string {
    const finalString = `${username.trim()}${senderId.trim()}${content.trim()}${secureKey.trim()}`;
    const hash = crypto.createHash("sha512");
    hash.update(finalString);
    return hash.digest("hex");
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    return `${day} ${month}, ${hours}:${minutes}`;
  }
}
