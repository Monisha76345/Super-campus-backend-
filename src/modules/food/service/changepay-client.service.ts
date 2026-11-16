import * as http from "http";
import * as https from "https";
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ChangePayRequestOptions {
  method?: HttpMethod;
  path: string;
  vendorJwt?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  appName?: boolean;
}

interface RawHttpResponse {
  status: number;
  statusText: string;
  text: string;
}

@Injectable()
export class ChangePayClientService {
  private readonly logger = new Logger(ChangePayClientService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<boolean>("changepay.enabled"));
  }

  requireConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Campus food ordering is not configured. Set CHANGEPAY_BASE_URL, CHANGEPAY_THIRD_PARTY_ID, CHANGEPAY_EXTERNAL_TOKEN, and CHANGEPAY_CLUSTER_ID.",
      );
    }
  }

  get thirdPartyId(): string {
    return this.config.get<string>("changepay.thirdPartyId") || "";
  }

  get externalToken(): string {
    return this.config.get<string>("changepay.externalToken") || "";
  }

  get clusterId(): string {
    return this.config.get<string>("changepay.clusterId") || "";
  }

  get appName(): string {
    return this.config.get<string>("changepay.appName") || "SuperCampus";
  }

  get defaultCustomerPhone(): string {
    return this.config.get<string>("changepay.defaultCustomerPhone") || "";
  }

  async request<T = unknown>(options: ChangePayRequestOptions): Promise<T> {
    this.requireConfigured();
    const baseUrl = this.config.get<string>("changepay.baseUrl") || "";
    const url = new URL(`${baseUrl}${options.path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null || value === "") {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const method = options.method || "GET";
    const bodyText = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (bodyText !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(bodyText).toString();
    }
    if (options.vendorJwt) {
      headers.Authorization = `JWT ${options.vendorJwt}`;
    }
    if (options.appName) {
      headers.AppName = this.appName;
    }

    let response: RawHttpResponse;
    try {
      // Use Node http(s) directly so ambient HTTP(S)_PROXY from local tooling
      // does not break ChangePay (global fetch/undici honors proxy env vars).
      response = await this.send(url, method, headers, bodyText);
    } catch (error) {
      const message = error instanceof Error ? error.message : "network error";
      this.logger.error(`ChangePay request failed: ${message}`);
      throw new BadGatewayException("Unable to reach ChangePay food services");
    }

    let payload: unknown = null;
    if (response.text) {
      try {
        payload = JSON.parse(response.text);
      } catch {
        payload = response.text;
      }
    }

    if (response.status < 200 || response.status >= 300) {
      const detail =
        typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message: unknown }).message)
          : response.text || response.statusText;
      this.logger.warn(`ChangePay ${method} ${options.path} → ${response.status}: ${detail}`);
      throw new BadGatewayException(detail || `ChangePay request failed (${response.status})`);
    }

    if (response.status === 204) {
      return null as T;
    }
    return payload as T;
  }

  private send(
    url: URL,
    method: HttpMethod,
    headers: Record<string, string>,
    bodyText?: string,
  ): Promise<RawHttpResponse> {
    const transport = url.protocol === "http:" ? http : https;
    return new Promise((resolve, reject) => {
      const req = transport.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (url.protocol === "http:" ? 80 : 443),
          path: `${url.pathname}${url.search}`,
          method,
          headers,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || "",
              text: Buffer.concat(chunks).toString("utf8"),
            });
          });
        },
      );
      req.on("error", reject);
      req.setTimeout(30000, () => {
        req.destroy(new Error("ChangePay request timed out"));
      });
      if (bodyText !== undefined) {
        req.write(bodyText);
      }
      req.end();
    });
  }
}
