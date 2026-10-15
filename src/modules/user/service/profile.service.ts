import { randomUUID } from "crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BufferedFile } from "src/common/s3-client/file.model";
import { DocumentUploaderService } from "src/common/document-uploader/services/document-uploader.service";
import { DocumentRefType } from "src/modules/document/entity/enums/document-ref-type.enum";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { EducationItemReqDto } from "../dto/request/education-item.req.dto";
import { ExperienceItemReqDto } from "../dto/request/experience-item.req.dto";
import { SkillItemReqDto } from "../dto/request/skill-item.req.dto";
import { UpdateProfileReqDto } from "../dto/request/update-profile.req.dto";
import { ProfileResDto } from "../dto/response/profile.res.dto";
import { CampusDirectory } from "../entity/campus-directory.model";
import { ProfileVisibility } from "../entity/enums/profile-visibility.enum";
import { ResidencyStatus } from "../entity/enums/residency-status.enum";
import { UserProfile } from "../entity/profile.model";
import { EducationItem, ExperienceItem, SkillItem } from "../entity/profile-items";
import { UserDataService } from "./user-data.service";

const HANDLE = /^[a-z0-9_]{3,40}$/;

@Injectable()
export class ProfileService {
  constructor(
    private readonly data: UserDataService,
    private readonly tenantContext: TenantContextService,
    private readonly documents: DocumentUploaderService,
  ) {}

  getMine(userId: string): Promise<ProfileResDto> {
    return this.withProfile(userId, async (profile, directory) => this.toResponse(profile, directory));
  }

  async updateMine(userId: string, body: UpdateProfileReqDto): Promise<ProfileResDto> {
    return this.withProfile(userId, async (profile, directory) => {
      const namespace = this.tenantContext.getTenantId();
      if (body.firstName !== undefined) {
        profile.firstName = this.clean(body.firstName);
      }
      if (body.lastName !== undefined) {
        profile.lastName = this.clean(body.lastName);
      }
      if (body.handle !== undefined) {
        profile.handle = await this.takeHandle(namespace, profile.userId, body.handle);
      }
      if (body.graduationYear !== undefined) {
        profile.graduationYear = body.graduationYear;
      }
      if (body.visibility !== undefined) {
        profile.visibility = body.visibility;
      }
      if (body.residency !== undefined) {
        profile.residency = body.residency;
        directory.isHostelite = body.residency === ResidencyStatus.HOSTEL_RESIDENT;
      }
      if (body.bio !== undefined) {
        profile.bio = this.clean(body.bio);
      }
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
      if (fullName) {
        directory.fullName = fullName;
      }
      profile.updatedBy = userId;
      directory.updatedBy = userId;
      const saved = await this.data.transaction(namespace, async (repo) => {
        const next = await repo.saveProfile(profile);
        await repo.saveDirectory(directory);
        return next;
      });
      return this.toResponse(saved, directory);
    });
  }

  async uploadPhoto(userId: string, file: BufferedFile): Promise<ProfileResDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("A photo is required");
    }
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Upload an image");
    }
    return this.withProfile(userId, async (profile, directory) => {
      const namespace = this.tenantContext.getTenantId();
      const uploaded = await this.documents.uploadFile(namespace, file, {
        entityType: "profile",
        entityId: profile.id,
        refType: DocumentRefType.USER,
        refId: userId,
      });
      profile.photoDocumentId = uploaded.documentId;
      profile.photoKey = uploaded.key;
      profile.updatedBy = userId;
      const saved = await this.data.saveProfile(namespace, profile);
      return this.toResponse(saved, directory);
    });
  }

  addEducation(userId: string, body: EducationItemReqDto): Promise<ProfileResDto> {
    return this.mutateList<EducationItem>(userId, "education", (items) => {
      items.push({
        id: randomUUID(),
        school: body.school.trim(),
        degree: body.degree.trim(),
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        visibility: body.visibility ?? ProfileVisibility.CAMPUS,
      });
    });
  }

  updateEducation(userId: string, itemId: string, body: EducationItemReqDto): Promise<ProfileResDto> {
    return this.mutateList<EducationItem>(userId, "education", (items) => {
      const item = this.requireItem(items, itemId);
      item.school = body.school.trim();
      item.degree = body.degree.trim();
      item.startDate = body.startDate ?? null;
      item.endDate = body.endDate ?? null;
      item.visibility = body.visibility ?? item.visibility;
    });
  }

  removeEducation(userId: string, itemId: string): Promise<ProfileResDto> {
    return this.mutateList<EducationItem>(userId, "education", (items) => this.dropItem(items, itemId));
  }

  addExperience(userId: string, body: ExperienceItemReqDto): Promise<ProfileResDto> {
    return this.mutateList<ExperienceItem>(userId, "experience", (items) => {
      const current = Boolean(body.current);
      items.push({
        id: randomUUID(),
        employer: body.employer.trim(),
        title: body.title.trim(),
        startDate: body.startDate ?? null,
        endDate: current ? null : body.endDate ?? null,
        current,
        visibility: body.visibility ?? ProfileVisibility.CAMPUS,
      });
    });
  }

  updateExperience(userId: string, itemId: string, body: ExperienceItemReqDto): Promise<ProfileResDto> {
    return this.mutateList<ExperienceItem>(userId, "experience", (items) => {
      const item = this.requireItem(items, itemId);
      const current = body.current ?? item.current;
      item.employer = body.employer.trim();
      item.title = body.title.trim();
      item.startDate = body.startDate ?? null;
      item.endDate = current ? null : body.endDate ?? null;
      item.current = current;
      item.visibility = body.visibility ?? item.visibility;
    });
  }

  removeExperience(userId: string, itemId: string): Promise<ProfileResDto> {
    return this.mutateList<ExperienceItem>(userId, "experience", (items) => this.dropItem(items, itemId));
  }

  addSkill(userId: string, body: SkillItemReqDto): Promise<ProfileResDto> {
    return this.mutateList<SkillItem>(userId, "skills", (items) => {
      const name = body.name.trim();
      if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        throw new ConflictException("That skill is already on your profile");
      }
      items.push({ id: randomUUID(), name });
    });
  }

  removeSkill(userId: string, itemId: string): Promise<ProfileResDto> {
    return this.mutateList<SkillItem>(userId, "skills", (items) => this.dropItem(items, itemId));
  }

  private async mutateList<T extends EducationItem | ExperienceItem | SkillItem>(
    userId: string,
    field: "education" | "experience" | "skills",
    change: (items: T[]) => void,
  ): Promise<ProfileResDto> {
    return this.withProfile(userId, async (profile, directory) => {
      const items = this.list<T>(profile[field]);
      change(items);
      if (field === "education") {
        profile.education = items as EducationItem[];
      } else if (field === "experience") {
        profile.experience = items as ExperienceItem[];
      } else {
        profile.skills = items as SkillItem[];
      }
      profile.updatedBy = userId;
      const saved = await this.data.saveProfile(this.tenantContext.getTenantId(), profile);
      return this.toResponse(saved, directory);
    });
  }

  private async withProfile(
    userId: string,
    work: (profile: UserProfile, directory: CampusDirectory) => Promise<ProfileResDto>,
  ): Promise<ProfileResDto> {
    const namespace = this.tenantContext.getTenantId();
    const user = await this.data.findUserById(namespace, userId);
    if (!user) {
      throw new NotFoundException("No campus account was found for this login");
    }
    const directory = await this.data.findDirectoryById(namespace, user.directoryId);
    if (!directory) {
      throw new NotFoundException("No campus directory row was found for this login");
    }
    const profile = (await this.data.findProfileByUserId(namespace, userId)) ?? (await this.createProfile(namespace, userId, directory));
    return work(profile, directory);
  }

  private async createProfile(namespace: string, userId: string, directory: CampusDirectory): Promise<UserProfile> {
    const [firstName, ...rest] = directory.fullName.trim().split(/\s+/);
    const profile = new UserProfile();
    profile.id = randomUUID();
    profile.userId = userId;
    profile.firstName = firstName || null;
    profile.lastName = rest.join(" ") || null;
    profile.handle = await this.reserveHandle(namespace, userId, this.handleFromEmail(directory.collegeEmail));
    profile.graduationYear = this.yearFromBatch(directory.batch);
    profile.visibility = ProfileVisibility.CAMPUS;
    profile.residency = directory.isHostelite ? ResidencyStatus.HOSTEL_RESIDENT : ResidencyStatus.NOT_SET;
    profile.bio = null;
    profile.photoDocumentId = null;
    profile.photoKey = null;
    profile.education = [];
    profile.experience = [];
    profile.skills = [];
    profile.createdBy = userId;
    profile.updatedBy = userId;
    return this.data.saveProfile(namespace, profile);
  }

  private async reserveHandle(namespace: string, userId: string, raw: string): Promise<string> {
    try {
      return await this.takeHandle(namespace, userId, raw);
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        throw error;
      }
      return this.takeHandle(namespace, userId, `${raw.slice(0, 34)}_${randomUUID().slice(0, 4)}`);
    }
  }

  private async takeHandle(namespace: string, userId: string, raw: string): Promise<string> {
    const handle = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    if (!HANDLE.test(handle)) {
      throw new BadRequestException("Handle must be 3 to 40 letters, numbers, or underscores");
    }
    const taken = await this.data.findProfileByHandle(namespace, handle);
    if (taken && taken.userId !== userId) {
      throw new ConflictException("That handle is already used on this campus");
    }
    return handle;
  }

  private handleFromEmail(email: string): string {
    const local = email.split("@")[0] ?? "campus";
    const handle = local.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    return handle.length >= 3 ? handle.slice(0, 40) : `${handle}_campus`.slice(0, 40);
  }

  private yearFromBatch(batch: string | null): number | null {
    const match = batch?.match(/\d{4}/);
    if (!match) {
      return null;
    }
    const year = Number(match[0]);
    return year >= 1990 && year <= 2100 ? year : null;
  }

  private clean(value: string): string | null {
    const next = value.trim();
    return next.length ? next : null;
  }

  private list<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
      return [...value] as T[];
    }
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private requireItem<T extends { id: string }>(items: T[], itemId: string): T {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException("That item is not on your profile");
    }
    return item;
  }

  private dropItem<T extends { id: string }>(items: T[], itemId: string): void {
    const index = items.findIndex((entry) => entry.id === itemId);
    if (index < 0) {
      throw new NotFoundException("That item is not on your profile");
    }
    items.splice(index, 1);
  }

  private toResponse(profile: UserProfile, directory: CampusDirectory): ProfileResDto {
    return {
      id: profile.id,
      usn: directory.usn,
      collegeEmail: directory.collegeEmail,
      role: directory.role,
      department: directory.department,
      batch: directory.batch,
      firstName: profile.firstName,
      lastName: profile.lastName,
      handle: profile.handle,
      graduationYear: profile.graduationYear,
      visibility: profile.visibility,
      residency: profile.residency,
      bio: profile.bio,
      photoDocumentId: profile.photoDocumentId,
      photoKey: profile.photoKey,
      education: this.list<EducationItem>(profile.education),
      experience: this.list<ExperienceItem>(profile.experience),
      skills: this.list<SkillItem>(profile.skills),
    };
  }
}
