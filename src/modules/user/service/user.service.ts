import { randomUUID } from "crypto";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hashPassword, verifyPassword } from "src/core/auth/utils/password.util";
import { PaginationMetaDto } from "src/core/common/dto/pagination-meta.dto";
import { MailService } from "src/core/mail/mail.service";
import { OtpService } from "src/core/redis/otp.service";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { CampusDirectory } from "../entity/campus-directory.model";
import { GlobalLogin } from "../entity/global-login.model";
import { AccountStatus } from "../entity/enums/account-status.enum";
import { DirectoryRole } from "../entity/enums/directory-role.enum";
import { DirectoryStatus } from "../entity/enums/directory-status.enum";
import { ImportBatchStatus } from "../entity/enums/import-batch-status.enum";
import { ImportBatch } from "../entity/import-batch.model";
import { UserAccount } from "../entity/user.model";
import { ActivationTokenResDto } from "../dto/response/activation-token.res.dto";
import { DirectoryResDto } from "../dto/response/directory.res.dto";
import { ImportBatchResDto, ImportRowErrorResDto } from "../dto/response/import-batch.res.dto";
import { OtpSentResDto } from "../dto/response/otp-sent.res.dto";
import { PendingAlumniPageResDto } from "../dto/response/pending-alumni.res.dto";
import { SessionAccount } from "../dto/response/session-account";
import { UserMapper } from "../mapper/user.mapper";
import { UserRepository } from "../repository/user.repository";
import { collegeEmailDomain, isCollegeEmail, normalizeMobile } from "./college-email";
import { DirectoryCsvRow, parseDirectoryCsv } from "./directory-csv";
import { UserDataService } from "./user-data.service";

export const GLOBAL_NAMESPACE = "global";

export type LoginLookup =
  | { kind: "ok"; account: SessionAccount }
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "pending" }
  | { kind: "awaiting-approval" }
  | { kind: "needs-mobile" }
  | { kind: "needs-otp" }
  | { kind: "use-usn" }
  | { kind: "disabled" };

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly data: UserDataService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async importDirectory(actorId: string, fileName: string, contents: Buffer): Promise<ImportBatchResDto> {
    const namespace = this.tenantContext.getTenantId();
    const parsed = parseDirectoryCsv(contents.toString("utf8"), collegeEmailDomain(this.config, namespace));
    const batch = new ImportBatch();
    batch.id = randomUUID();
    batch.fileName = fileName || "directory.csv";
    batch.uploadedBy = actorId;
    batch.createdBy = actorId;
    batch.status = ImportBatchStatus.PROCESSING;
    batch.totalRows = parsed.rows.length + parsed.errors.length;
    batch.createdCount = 0;
    batch.updatedCount = 0;
    batch.skippedCount = 0;
    batch.errorCount = parsed.errors.length;
    batch.errorDetails = null;
    await this.data.saveBatch(namespace, batch);

    const errors: ImportRowErrorResDto[] = [...parsed.errors];
    const seenUsn = new Set<string>();
    const seenEmail = new Set<string>();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of parsed.rows) {
      if (seenUsn.has(row.usn) || seenEmail.has(row.collegeEmail)) {
        errors.push({ row: row.rowNumber, message: "Duplicate USN or college email in the file" });
        continue;
      }
      seenUsn.add(row.usn);
      seenEmail.add(row.collegeEmail);
      try {
        const outcome = await this.applyRow(namespace, actorId, row);
        if (outcome === "created") {
          created += 1;
        } else if (outcome === "updated") {
          updated += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        if (error instanceof HttpException) {
          errors.push({ row: row.rowNumber, message: error.message });
          continue;
        }
        this.logger.error(`Import row ${row.rowNumber} failed for ${namespace}`, error instanceof Error ? error.stack : undefined);
        errors.push({ row: row.rowNumber, message: "This row could not be saved" });
      }
    }

    batch.createdCount = created;
    batch.updatedCount = updated;
    batch.skippedCount = skipped;
    batch.errorCount = errors.length;
    batch.errorDetails = JSON.stringify(errors.slice(0, 100));
    batch.status = ImportBatchStatus.DONE;
    batch.updatedBy = actorId;
    await this.data.saveBatch(namespace, batch);
    this.logger.log(
      `Directory import ${batch.id} on ${namespace}: created=${created} updated=${updated} skipped=${skipped} errors=${errors.length}`,
    );
    return UserMapper.toImportBatch(batch, errors.slice(0, 100));
  }

  async setHostelite(actorId: string, usn: string, isHostelite: boolean): Promise<DirectoryResDto> {
    const namespace = this.tenantContext.getTenantId();
    const directory = await this.requireDirectory(namespace, usn);
    if (directory.role !== DirectoryRole.STUDENT) {
      throw new BadRequestException("Hostelite applies only to students");
    }
    if (directory.status === DirectoryStatus.DISABLED) {
      throw new BadRequestException("This account is disabled");
    }
    directory.isHostelite = isHostelite;
    directory.updatedBy = actorId;
    const saved = await this.data.saveDirectory(namespace, directory);
    return UserMapper.toDirectory(saved);
  }

  async convertToAlumni(actorId: string, usn: string): Promise<DirectoryResDto> {
    const namespace = this.tenantContext.getTenantId();
    const directory = await this.requireDirectory(namespace, usn);
    if (directory.role !== DirectoryRole.STUDENT) {
      throw new BadRequestException("Only a student record can be converted to alumni");
    }
    directory.role = DirectoryRole.ALUMNI;
    directory.isHostelite = false;
    directory.status = DirectoryStatus.PENDING;
    directory.mobile = null;
    directory.updatedBy = actorId;
    const saved = await this.data.saveDirectory(namespace, directory);
    await this.disableCollegeLogin(namespace, saved, actorId);
    this.logger.log(`Converted ${saved.usn} to alumni on ${namespace}`);
    return UserMapper.toDirectory(saved);
  }

  async listPendingAlumni(page = 1, limit = 20): Promise<PendingAlumniPageResDto> {
    const namespace = this.tenantContext.getTenantId();
    const [rows, total] = await this.data.findPendingAlumni(namespace, page, limit);
    return {
      data: rows.map((row) => UserMapper.toDirectory(row)),
      meta: PaginationMetaDto.from(total, page, limit, rows.length),
    };
  }

  async claimAlumni(tenantId: string, usn: string, mobile: string): Promise<DirectoryResDto> {
    const directory = await this.requireDirectory(tenantId, usn);
    if (directory.role !== DirectoryRole.ALUMNI) {
      throw new BadRequestException("This USN is not an alumni record. Contact the campus admin");
    }
    if (directory.status === DirectoryStatus.DISABLED) {
      throw new BadRequestException("This account is disabled");
    }
    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      throw new BadRequestException("Enter a valid mobile number");
    }
    if (directory.status === DirectoryStatus.ACTIVE && directory.mobile === normalized) {
      throw new BadRequestException("This alumni account is already approved. Sign in with your USN");
    }
    directory.mobile = normalized;
    directory.status = DirectoryStatus.PENDING;
    directory.updatedBy = directory.usn;
    const saved = await this.data.saveDirectory(tenantId, directory);
    this.logger.log(`Alumni claim saved for ${saved.usn} on ${tenantId}`);
    return UserMapper.toDirectory(saved);
  }

  async approveAlumni(actorId: string, usn: string): Promise<DirectoryResDto> {
    const namespace = this.tenantContext.getTenantId();
    const directory = await this.requireDirectory(namespace, usn);
    if (directory.role !== DirectoryRole.ALUMNI) {
      throw new BadRequestException("This USN is not an alumni record");
    }
    if (!directory.mobile) {
      throw new BadRequestException("This alumni record has no mobile number yet");
    }
    directory.status = DirectoryStatus.ACTIVE;
    directory.updatedBy = actorId;
    const saved = await this.data.saveDirectory(namespace, directory);
    await this.upsertGlobalLogin(namespace, saved.id, saved.usn);
    this.logger.log(`Approved alumni ${saved.usn} on ${namespace}`);
    return UserMapper.toDirectory(saved);
  }

  async rejectAlumni(actorId: string, usn: string): Promise<DirectoryResDto> {
    const namespace = this.tenantContext.getTenantId();
    const directory = await this.requireDirectory(namespace, usn);
    if (directory.role !== DirectoryRole.ALUMNI) {
      throw new BadRequestException("This USN is not an alumni record");
    }
    directory.mobile = null;
    directory.status = DirectoryStatus.PENDING;
    directory.updatedBy = actorId;
    const saved = await this.data.saveDirectory(namespace, directory);
    await this.removeGlobalLogin(namespace, saved.id);
    return UserMapper.toDirectory(saved);
  }

  async requestActivation(email: string): Promise<OtpSentResDto> {
    const loginId = email.trim().toLowerCase();
    const located = await this.locate(loginId);
    if (!located) {
      throw new NotFoundException("This college email is not on the campus list");
    }
    const { directory } = located;
    if (directory.status === DirectoryStatus.DISABLED) {
      throw new BadRequestException("This account is disabled");
    }
    if (directory.role === DirectoryRole.ALUMNI && directory.status === DirectoryStatus.GRADUATED) {
      throw new BadRequestException("Verify alumni access with your USN and personal email");
    }
    if (directory.userId && directory.status === DirectoryStatus.ACTIVE) {
      throw new BadRequestException("This account is already active. Sign in with your password");
    }
    if (directory.status !== DirectoryStatus.PENDING) {
      throw new BadRequestException("This account cannot be activated");
    }
    const code = await this.otp.issue(`activate:${loginId}`);
    const debugOtp = await this.deliver(loginId, code);
    return { destination: loginId, debugOtp };
  }

  async verifyActivation(email: string, otp: string): Promise<ActivationTokenResDto> {
    const loginId = email.trim().toLowerCase();
    const located = await this.locate(loginId);
    if (!located || located.directory.status !== DirectoryStatus.PENDING) {
      throw new UnauthorizedException("Invalid or expired code");
    }
    const valid = await this.otp.check(`activate:${loginId}`, otp.trim());
    if (!valid) {
      throw new UnauthorizedException("Invalid or expired code");
    }
    const activationToken = await this.otp.saveActivation({
      tenantId: located.tenantId,
      directoryId: located.directory.id,
      email: loginId,
    });
    return { activationToken };
  }

  async completeActivation(activationToken: string, password: string): Promise<SessionAccount> {
    const claim = await this.otp.takeActivation(activationToken.trim());
    if (!claim) {
      throw new UnauthorizedException("This activation link has expired");
    }
    const account = await this.data.transaction(claim.tenantId, async (repo) => {
      const directory = await repo.findDirectoryById(claim.directoryId);
      if (!directory || directory.collegeEmail !== claim.email || directory.status !== DirectoryStatus.PENDING) {
        throw new UnauthorizedException("This activation link has expired");
      }
      if (directory.userId) {
        throw new BadRequestException("This account is already active. Sign in with your password");
      }
      const user = new UserAccount();
      user.id = randomUUID();
      user.directoryId = directory.id;
      user.loginId = directory.collegeEmail;
      user.passwordHash = await hashPassword(password);
      user.status = AccountStatus.ACTIVE;
      user.changePasswordRequired = false;
      user.lastLoggedIn = new Date();
      user.createdBy = user.id;
      await repo.saveUser(user);
      directory.userId = user.id;
      directory.status = DirectoryStatus.ACTIVE;
      directory.updatedBy = user.id;
      await repo.saveDirectory(directory);
      return UserMapper.toSession(claim.tenantId, directory, user);
    });
    this.logger.log(`Activated ${account.email} on ${claim.tenantId}`);
    return account;
  }

  async requestPasswordReset(email: string): Promise<OtpSentResDto> {
    const loginId = email.trim().toLowerCase();
    const located = await this.locate(loginId);
    if (!located) {
      throw new NotFoundException("This college email is not registered on the campus list");
    }
    const { directory } = located;
    if (directory.status === DirectoryStatus.DISABLED) {
      throw new BadRequestException("This account is disabled. Contact your campus administrator");
    }
    if (!directory.userId || directory.status === DirectoryStatus.PENDING) {
      throw new BadRequestException("This account has not been activated yet. Please activate your account first");
    }
    const code = await this.otp.issue(`forgot:${loginId}`);
    const debugOtp = await this.deliver(loginId, code);
    return { destination: loginId, debugOtp };
  }

  async verifyPasswordReset(email: string, otp: string): Promise<{ resetToken: string }> {
    const loginId = email.trim().toLowerCase();
    const located = await this.locate(loginId);
    if (!located || !located.directory.userId) {
      throw new UnauthorizedException("Invalid or expired code");
    }
    const valid = await this.otp.check(`forgot:${loginId}`, otp.trim());
    if (!valid) {
      throw new UnauthorizedException("Invalid or expired code");
    }
    const resetToken = await this.otp.savePasswordReset({
      tenantId: located.tenantId,
      userId: located.directory.userId,
      directoryId: located.directory.id,
      email: loginId,
    });
    return { resetToken };
  }

  async completePasswordReset(resetToken: string, password: string): Promise<SessionAccount> {
    const claim = await this.otp.takePasswordReset(resetToken.trim());
    if (!claim) {
      throw new UnauthorizedException("This password reset link has expired");
    }
    const account = await this.data.transaction(claim.tenantId, async (repo) => {
      const directory = await repo.findDirectoryById(claim.directoryId);
      if (!directory || directory.collegeEmail !== claim.email) {
        throw new UnauthorizedException("This password reset link has expired");
      }
      const user = await repo.findUserById(claim.userId);
      if (!user) {
        throw new UnauthorizedException("User account not found");
      }
      user.passwordHash = await hashPassword(password);
      user.changePasswordRequired = false;
      user.updatedBy = user.id;
      user.lastLoggedIn = new Date();
      await repo.saveUser(user);
      return UserMapper.toSession(claim.tenantId, directory, user);
    });
    this.logger.log(`Password reset completed for ${account.email} on ${claim.tenantId}`);
    return account;
  }

  async requestAlumniOtp(tenantId: string, usn: string, mobile: string): Promise<OtpSentResDto> {
    const directory = await this.requireApprovedAlumni(tenantId, usn, mobile);
    const code = await this.otp.issue(`alumni:${tenantId}:${directory.usn}`);
    const debugOtp = this.debugCode(code);
    return { destination: directory.mobile ?? mobile, debugOtp };
  }

  async completeAlumni(
    tenantId: string,
    usn: string,
    mobile: string,
    otp: string,
    password: string,
  ): Promise<SessionAccount> {
    const directory = await this.requireApprovedAlumni(tenantId, usn, mobile);
    const valid = await this.otp.check(`alumni:${tenantId}:${directory.usn}`, otp.trim());
    if (!valid) {
      throw new UnauthorizedException("Invalid or expired code");
    }
    await this.assertLoginAvailable(tenantId, directory.id, directory.usn);
    const account = await this.data.transaction(tenantId, async (repo) => {
      const current = await repo.findDirectoryById(directory.id);
      if (!current || current.role !== DirectoryRole.ALUMNI || current.status !== DirectoryStatus.ACTIVE) {
        throw new BadRequestException("This alumni account is not approved yet");
      }
      let user = await repo.findUserByDirectoryId(current.id);
      if (!user) {
        user = new UserAccount();
        user.id = randomUUID();
        user.directoryId = current.id;
        user.createdBy = user.id;
      }
      user.loginId = current.usn;
      user.passwordHash = await hashPassword(password);
      user.changePasswordRequired = false;
      user.lastLoggedIn = new Date();
      user.status = AccountStatus.ACTIVE;
      user.updatedBy = user.id;
      await repo.saveUser(user);
      current.userId = user.id;
      current.updatedBy = user.id;
      await repo.saveDirectory(current);
      return UserMapper.toSession(tenantId, current, user);
    });
    await this.upsertGlobalLogin(tenantId, directory.id, directory.usn);
    this.logger.log(`Alumni login ready for ${directory.usn} on ${tenantId}`);
    return account;
  }

  async authenticate(email: string, password: string): Promise<LoginLookup> {
    const trimmed = email.trim();
    const isEmail = trimmed.includes("@");
    const loginId = isEmail ? trimmed.toLowerCase() : trimmed.toUpperCase();
    const located = await this.locate(loginId);
    if (!located) {
      return { kind: "missing" };
    }
    const { tenantId, directory } = located;
    if (directory.status === DirectoryStatus.DISABLED) {
      return { kind: "disabled" };
    }
    if (isEmail && directory.role === DirectoryRole.ALUMNI) {
      return { kind: "use-usn" };
    }
    if (isEmail && !isCollegeEmail(loginId, collegeEmailDomain(this.config, tenantId))) {
      return { kind: "invalid" };
    }
    if (!isEmail && directory.role !== DirectoryRole.ALUMNI) {
      return { kind: "invalid" };
    }
    if (directory.role === DirectoryRole.ALUMNI) {
      if (directory.status !== DirectoryStatus.ACTIVE) {
        return directory.mobile ? { kind: "awaiting-approval" } : { kind: "needs-mobile" };
      }
      const user = await this.data.findUserByDirectoryId(tenantId, directory.id);
      if (!user || user.status !== AccountStatus.ACTIVE || user.loginId !== directory.usn) {
        return { kind: "needs-otp" };
      }
      return this.acceptPassword(tenantId, directory, user, password, loginId);
    }
    const user = await this.data.findUserByDirectoryId(tenantId, directory.id);
    if (!user || directory.status === DirectoryStatus.PENDING) {
      return { kind: "pending" };
    }
    if (user.status === AccountStatus.DISABLED) {
      return { kind: "disabled" };
    }
    return this.acceptPassword(tenantId, directory, user, password, loginId);
  }

  async changePassword(userId: string, password: string): Promise<void> {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.data.findUserById(tenantId, userId);
    if (!user) {
      throw new NotFoundException("Account not found");
    }
    user.passwordHash = await hashPassword(password);
    user.changePasswordRequired = false;
    user.updatedBy = userId;
    await this.data.saveUser(tenantId, user);
    this.logger.log(`Password changed for user ${userId} on ${tenantId}`);
  }

  private async applyRow(namespace: string, actorId: string, row: DirectoryCsvRow): Promise<"created" | "updated" | "skipped"> {
    const outcome = await this.data.transaction(namespace, async (repo) => {
      const byEmail = await repo.findDirectoryByCollegeEmail(row.collegeEmail);
      if (byEmail && byEmail.usn !== row.usn) {
        throw new ConflictException("College email belongs to a different USN");
      }
      const existing = await repo.findDirectoryByUsn(row.usn);
      if (!existing) {
        const created = this.newDirectory(actorId, row);
        await repo.saveDirectory(created);
        if (created.role === DirectoryRole.ALUMNI) {
          return { kind: "created" as const, directory: created, loginId: null as string | null, clearLogin: false };
        }
        await this.openCollegeAccount(repo, created, row.password ?? "", actorId);
        return { kind: "created" as const, directory: created, loginId: created.collegeEmail, clearLogin: false };
      }
      if (existing.role === DirectoryRole.ALUMNI && existing.status === DirectoryStatus.ACTIVE && row.role !== DirectoryRole.ALUMNI) {
        throw new ConflictException("This USN is already an active alumni account");
      }
      const becomingAlumni = existing.role !== DirectoryRole.ALUMNI && row.role === DirectoryRole.ALUMNI;
      if (!row.password && !becomingAlumni && this.sameDirectory(existing, row)) {
        const loginId = existing.role === DirectoryRole.ALUMNI ? existing.usn : existing.collegeEmail;
        return {
          kind: "skipped" as const,
          directory: existing,
          loginId: existing.role === DirectoryRole.ALUMNI && existing.status !== DirectoryStatus.ACTIVE ? null : loginId,
          clearLogin: false,
        };
      }
      this.assignDirectory(existing, row, actorId);
      await repo.saveDirectory(existing);
      if (existing.role === DirectoryRole.ALUMNI) {
        const user = existing.userId ? await repo.findUserByDirectoryId(existing.id) : null;
        if (user && user.loginId !== existing.usn) {
          user.status = AccountStatus.DISABLED;
          user.updatedBy = actorId;
          await repo.saveUser(user);
        }
        return {
          kind: "updated" as const,
          directory: existing,
          loginId: existing.status === DirectoryStatus.ACTIVE ? existing.usn : null,
          clearLogin: existing.status !== DirectoryStatus.ACTIVE,
        };
      }
      if (row.password) {
        await this.openCollegeAccount(repo, existing, row.password, actorId);
      }
      return { kind: "updated" as const, directory: existing, loginId: existing.collegeEmail, clearLogin: false };
    });
    if (outcome.clearLogin) {
      await this.removeGlobalLogin(namespace, outcome.directory.id);
    } else if (outcome.loginId) {
      await this.upsertGlobalLogin(namespace, outcome.directory.id, outcome.loginId);
    }
    return outcome.kind;
  }

  private newDirectory(actorId: string, row: DirectoryCsvRow): CampusDirectory {
    const directory = new CampusDirectory();
    directory.id = randomUUID();
    directory.usn = row.usn;
    directory.fullName = row.fullName;
    directory.collegeEmail = row.collegeEmail;
    directory.personalEmail = row.personalEmail;
    directory.department = row.department;
    directory.batch = row.batch;
    directory.program = row.program;
    directory.role = row.role;
    directory.mobile = row.mobile;
    directory.isHostelite = row.role === DirectoryRole.STUDENT ? row.isHostelite : false;
    directory.status = row.role === DirectoryRole.ALUMNI ? DirectoryStatus.PENDING : DirectoryStatus.ACTIVE;
    directory.userId = null;
    directory.createdBy = actorId;
    return directory;
  }

  private assignDirectory(existing: CampusDirectory, row: DirectoryCsvRow, actorId: string): void {
    const becomingAlumni = existing.role !== DirectoryRole.ALUMNI && row.role === DirectoryRole.ALUMNI;
    existing.fullName = row.fullName;
    existing.collegeEmail = row.collegeEmail;
    if (row.personalEmailProvided) {
      existing.personalEmail = row.personalEmail;
    }
    if (row.mobileProvided) {
      existing.mobile = row.mobile;
    }
    existing.department = row.department;
    existing.batch = row.batch;
    existing.program = row.program;
    existing.role = row.role;
    existing.isHostelite = row.role === DirectoryRole.STUDENT ? row.isHostelite : false;
    if (becomingAlumni) {
      existing.status = DirectoryStatus.PENDING;
      existing.isHostelite = false;
      if (!row.mobileProvided) {
        existing.mobile = null;
      }
    }
    existing.updatedBy = actorId;
  }

  private sameDirectory(existing: CampusDirectory, row: DirectoryCsvRow): boolean {
    const personalSame = row.personalEmailProvided ? (existing.personalEmail ?? null) === row.personalEmail : true;
    const mobileSame = row.mobileProvided ? (existing.mobile ?? null) === row.mobile : true;
    return (
      existing.fullName === row.fullName &&
      existing.collegeEmail === row.collegeEmail &&
      personalSame &&
      mobileSame &&
      (existing.department ?? null) === row.department &&
      (existing.batch ?? null) === row.batch &&
      (existing.program ?? null) === row.program &&
      existing.role === row.role &&
      Boolean(existing.isHostelite) === row.isHostelite
    );
  }

  private async assertLoginAvailable(tenantId: string, directoryId: string, loginId: string): Promise<void> {
    const existing = await this.data.findGlobalByLoginId(GLOBAL_NAMESPACE, loginId);
    if (existing && (existing.tenantId !== tenantId || existing.directoryId !== directoryId)) {
      throw new ConflictException("This email is already registered to another campus");
    }
  }

  private async upsertGlobalLogin(tenantId: string, directoryId: string, loginId: string): Promise<void> {
    await this.assertLoginAvailable(tenantId, directoryId, loginId);
    await this.data.transaction(GLOBAL_NAMESPACE, async (repo) => {
      const byDirectory = await repo.findGlobalByDirectory(tenantId, directoryId);
      const byLogin = await repo.findGlobalByLoginId(loginId);
      if (byLogin && (byLogin.tenantId !== tenantId || byLogin.directoryId !== directoryId)) {
        throw new ConflictException("This email is already registered to another campus");
      }
      if (byDirectory) {
        if (byDirectory.loginId !== loginId) {
          byDirectory.loginId = loginId;
          await repo.saveGlobalLogin(byDirectory);
        }
        return;
      }
      const created = new GlobalLogin();
      created.id = randomUUID();
      created.loginId = loginId;
      created.tenantId = tenantId;
      created.directoryId = directoryId;
      await repo.saveGlobalLogin(created);
    });
  }

  private async locate(loginId: string): Promise<{ tenantId: string; directory: CampusDirectory } | null> {
    const globalLogin = await this.data.findGlobalByLoginId(GLOBAL_NAMESPACE, loginId);
    if (globalLogin) {
      const directory = await this.data.findDirectoryById(globalLogin.tenantId, globalLogin.directoryId);
      if (directory) {
        return { tenantId: globalLogin.tenantId, directory };
      }
    }
    const defaultTenant = this.config.get<string>("DEFAULT_TENANT_ID") || "nmit";
    const fallbackDir = await this.data.findDirectoryByCollegeEmail(defaultTenant, loginId);
    if (fallbackDir) {
      return { tenantId: defaultTenant, directory: fallbackDir };
    }
    return null;
  }

  private async requireDirectory(namespace: string, usn: string): Promise<CampusDirectory> {
    const directory = await this.data.findDirectoryByUsn(namespace, usn.trim().toUpperCase());
    if (!directory) {
      throw new NotFoundException("This USN is not on the campus list");
    }
    return directory;
  }

  private async acceptPassword(
    tenantId: string,
    directory: CampusDirectory,
    user: UserAccount,
    password: string,
    loginId: string,
  ): Promise<LoginLookup> {
    const matches = await verifyPassword(password, user.passwordHash);
    if (!matches || user.loginId !== loginId) {
      return { kind: "invalid" };
    }
    user.lastLoggedIn = new Date();
    user.updatedBy = user.id;
    await this.data.saveUser(tenantId, user);
    return { kind: "ok", account: UserMapper.toSession(tenantId, directory, user) };
  }

  private async openCollegeAccount(
    repo: UserRepository,
    directory: CampusDirectory,
    password: string,
    actorId: string,
  ): Promise<void> {
    if (password.length < 6) {
      throw new BadRequestException("College password is required");
    }
    let user = directory.id ? await repo.findUserByDirectoryId(directory.id) : null;
    if (!user) {
      user = new UserAccount();
      user.id = randomUUID();
      user.directoryId = directory.id;
      user.createdBy = actorId;
    }
    user.loginId = directory.collegeEmail;
    user.passwordHash = await hashPassword(password);
    user.status = AccountStatus.ACTIVE;
    user.changePasswordRequired = true;
    user.updatedBy = actorId;
    await repo.saveUser(user);
    directory.userId = user.id;
    directory.status = DirectoryStatus.ACTIVE;
    directory.updatedBy = actorId;
    await repo.saveDirectory(directory);
  }

  private async disableCollegeLogin(namespace: string, directory: CampusDirectory, actorId: string): Promise<void> {
    if (directory.userId) {
      const user = await this.data.findUserById(namespace, directory.userId);
      if (user && user.loginId !== directory.usn) {
        user.status = AccountStatus.DISABLED;
        user.updatedBy = actorId;
        await this.data.saveUser(namespace, user);
      }
    }
    await this.removeGlobalLogin(namespace, directory.id);
  }

  private async removeGlobalLogin(tenantId: string, directoryId: string): Promise<void> {
    await this.data.transaction(GLOBAL_NAMESPACE, async (repo) => {
      const existing = await repo.findGlobalByDirectory(tenantId, directoryId);
      if (existing) {
        await repo.removeGlobalLogin(existing.id);
      }
    });
  }

  private async requireApprovedAlumni(tenantId: string, usn: string, mobile: string): Promise<CampusDirectory> {
    const directory = await this.requireDirectory(tenantId, usn);
    if (directory.role !== DirectoryRole.ALUMNI) {
      throw new BadRequestException("This USN is not an alumni record. Contact the campus admin");
    }
    if (directory.status === DirectoryStatus.PENDING || directory.status === DirectoryStatus.GRADUATED) {
      throw new BadRequestException(
        directory.mobile ? "Waiting for admin approval" : "Submit your mobile number for admin verification",
      );
    }
    if (directory.status !== DirectoryStatus.ACTIVE) {
      throw new BadRequestException("This account is disabled");
    }
    const normalized = normalizeMobile(mobile);
    if (!normalized || directory.mobile !== normalized) {
      throw new BadRequestException("This mobile number does not match the approved number");
    }
    return directory;
  }

  private debugCode(otp: string): string | undefined {
    if (this.config.get<string>("NODE_ENV") === "production") {
      throw new ServiceUnavailableException("SMS is not configured");
    }
    return otp;
  }

  private async deliver(to: string, otp: string): Promise<string | undefined> {
    let delivered = false;
    try {
      delivered = await this.mail.sendOtp(to, otp);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.error(`OTP delivery failed for ${to}: ${message}`);
      if (this.config.get<string>("NODE_ENV") === "production") {
        throw new ServiceUnavailableException("The verification email could not be sent");
      }
    }
    if (delivered) {
      return undefined;
    }
    if (this.config.get<string>("NODE_ENV") === "production") {
      throw new ServiceUnavailableException("Email is not configured");
    }
    return otp;
  }

  async getStudentForOutpass(userId: string): Promise<{
    fullName: string;
    usn: string | null;
    isHostelite: boolean;
  }> {
    const namespace = this.tenantContext.getTenantId();
    const user = await this.data.findUserById(namespace, userId);
    if (!user) {
      throw new NotFoundException("User account not found");
    }
    const directory = await this.data.findDirectoryById(namespace, user.directoryId);
    const profile = await this.data.findProfileByUserId(namespace, userId);
    const fullName =
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
      directory?.fullName ||
      "Student";
    const isHostelite = directory?.isHostelite ?? false;
    return {
      fullName,
      usn: directory?.usn ?? null,
      isHostelite,
    };
  }

  async updateTheme(userId: string, theme: string): Promise<{ theme: string }> {
    const valid = ["dark", "light", "system"];
    if (!valid.includes(theme)) {
      throw new BadRequestException("Invalid theme option. Allowed values: dark, light, system");
    }
    const namespace = this.tenantContext.getTenantId();
    const user = await this.data.findUserById(namespace, userId);
    if (!user) {
      // Graceful fallback for synthetic or mock accounts
      return { theme };
    }
    user.theme = theme;
    await this.data.saveUser(namespace, user);
    return { theme };
  }
}
