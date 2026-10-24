import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { LoginReqDto } from "./dto/login.req.dto";
import { LoginResDto } from "./dto/login.res.dto";
import { ActivationTokenResDto } from "src/modules/user/dto/response/activation-token.res.dto";
import { DirectoryResDto } from "src/modules/user/dto/response/directory.res.dto";
import { OtpSentResDto } from "src/modules/user/dto/response/otp-sent.res.dto";
import { ResetTokenResDto } from "./dto/reset-token.res.dto";
import { SessionAccount } from "src/modules/user/dto/response/session-account";
import { UserService } from "src/modules/user/service/user.service";
import { TenantContextService } from "../tenant/tenant-context.service";

const LOCAL_ROLES = ["student", "faculty", "warden", "alumni", "superadmin"] as const;
type LocalRole = (typeof LOCAL_ROLES)[number];

const LOCAL_JWT_ROLE: Record<LocalRole, string> = {
  student: "STUDENT",
  faculty: "FACULTY",
  warden: "WARDEN",
  alumni: "ALUMNI",
  superadmin: "SUPER_ADMIN",
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly users: UserService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async login(body: LoginReqDto): Promise<LoginResDto> {
    const lookup = await this.users.authenticate(body.email, body.password);
    if (lookup.kind === "ok") {
      return this.issue(lookup.account);
    }
    if (lookup.kind === "pending") {
      throw new UnauthorizedException("This college account is not ready. Ask the campus admin");
    }
    if (lookup.kind === "awaiting-approval") {
      throw new UnauthorizedException("Waiting for admin approval");
    }
    if (lookup.kind === "needs-mobile") {
      throw new UnauthorizedException("Submit your USN and mobile number for admin verification");
    }
    if (lookup.kind === "needs-otp") {
      throw new UnauthorizedException("Verify the code sent to your mobile, then set a password");
    }
    if (lookup.kind === "use-usn") {
      throw new UnauthorizedException("Alumni sign in with USN, not the college email");
    }
    if (lookup.kind === "disabled") {
      throw new UnauthorizedException("This account is disabled");
    }
    if (lookup.kind === "invalid") {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.localLogin(body);
  }

  requestActivation(email: string): Promise<OtpSentResDto> {
    return this.users.requestActivation(email);
  }

  verifyActivation(email: string, otp: string): Promise<ActivationTokenResDto> {
    return this.users.verifyActivation(email, otp);
  }

  async completeActivation(activationToken: string, password: string): Promise<LoginResDto> {
    const account = await this.users.completeActivation(activationToken, password);
    return this.issue(account);
  }

  requestPasswordReset(email: string): Promise<OtpSentResDto> {
    return this.users.requestPasswordReset(email);
  }

  async verifyPasswordReset(email: string, otp: string): Promise<ResetTokenResDto> {
    return this.users.verifyPasswordReset(email, otp);
  }

  async completePasswordReset(resetToken: string, password: string): Promise<LoginResDto> {
    const account = await this.users.completePasswordReset(resetToken, password);
    return this.issue(account);
  }

  claimAlumni(usn: string, mobile: string, tenantId?: string): Promise<DirectoryResDto> {
    return this.users.claimAlumni(this.campusId(tenantId), usn, mobile);
  }

  requestAlumniOtp(usn: string, mobile: string, tenantId?: string): Promise<OtpSentResDto> {
    return this.users.requestAlumniOtp(this.campusId(tenantId), usn, mobile);
  }

  async completeAlumni(
    usn: string,
    mobile: string,
    otp: string,
    password: string,
    tenantId?: string,
  ): Promise<LoginResDto> {
    const account = await this.users.completeAlumni(this.campusId(tenantId), usn, mobile, otp, password);
    return this.issue(account);
  }

  changePassword(userId: string, password: string): Promise<void> {
    return this.users.changePassword(userId, password);
  }

  private issue(account: SessionAccount): LoginResDto {
    const token = this.jwtService.sign({
      sub: account.id,
      email: account.email,
      roles: [account.role],
      tenantId: account.tenantId,
      hostelite: account.hostelite,
    });
    this.tenantContext.setTenantId(account.tenantId);
    return {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      role: account.mobileRole,
      token,
      tenantId: account.tenantId,
      campusName: this.campusName(account.tenantId),
      hostelite: account.hostelite,
      changePasswordRequired: account.changePasswordRequired,
      theme: account.theme || "dark",
    };
  }

  private localLogin(body: LoginReqDto): LoginResDto {
    if (this.config.get<string>("NODE_ENV") === "production") {
      throw new UnauthorizedException("Invalid email or password");
    }
    const email = this.required("LOCAL_LOGIN_EMAIL");
    const password = this.required("LOCAL_LOGIN_PASSWORD");
    const emailMatches = body.email.trim().toLowerCase() === email.toLowerCase();
    if (!emailMatches || body.password !== password) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const tenantId = body.tenantId?.trim() || this.required("DEFAULT_TENANT_ID");
    const role = this.localRole(this.required("LOCAL_LOGIN_ROLE"));
    const token = this.jwtService.sign({
      sub: this.required("LOCAL_LOGIN_USER_ID"),
      email,
      roles: [LOCAL_JWT_ROLE[role]],
      tenantId,
      hostelite: false,
    });
    return {
      id: this.required("LOCAL_LOGIN_USER_ID"),
      email,
      fullName: this.required("LOCAL_LOGIN_FULL_NAME"),
      role,
      token,
      tenantId,
      campusName: this.campusName(tenantId),
      hostelite: false,
      changePasswordRequired: false,
      theme: "dark",
    };
  }

  private campusId(explicit?: string): string {
    const fromBody = explicit?.trim();
    if (fromBody) {
      return fromBody;
    }
    try {
      return this.tenantContext.getTenantId();
    } catch {
      return this.required("DEFAULT_TENANT_ID");
    }
  }

  private campusName(tenantId: string): string {
    const defaultTenant = this.config.get<string>("DEFAULT_TENANT_ID")?.trim();
    const configuredName = this.config.get<string>("DEFAULT_CAMPUS_NAME")?.trim();
    if (configuredName && (!defaultTenant || tenantId === defaultTenant)) {
      return configuredName;
    }
    return tenantId;
  }

  private localRole(raw: string): LocalRole {
    const value = raw.trim().toLowerCase();
    if (value === "campus_admin" || value === "super_admin" || value === "admin") {
      return "superadmin";
    }
    if (value === "student" || value === "faculty" || value === "warden" || value === "alumni" || value === "superadmin") {
      return value;
    }
    throw new UnauthorizedException("LOCAL_LOGIN_ROLE is not a supported role");
  }

  private required(key: string): string {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      throw new UnauthorizedException(`${key} is not configured`);
    }
    return value;
  }
}
