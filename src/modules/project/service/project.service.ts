import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { ROLES } from "src/core/common/constants/roles";
import { JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { CreateProjectReqDto } from "../dto/request/create-project.req.dto";
import { ProjectQueryDto } from "../dto/request/project-query.dto";
import {
  ProjectApplicationResDto,
  ProjectContributionResDto,
  ProjectResDto,
} from "../dto/response/project.res.dto";
import { ProjectCategory } from "../entity/enums/project-category.enum";
import { ProjectStatus } from "../entity/enums/project-status.enum";
import { ProjectVisibility } from "../entity/enums/project-visibility.enum";
import { ProjectApplication } from "../entity/project-application.model";
import { ProjectContribution } from "../entity/project-contribution.model";
import { ProjectMedia } from "../entity/project-media.model";
import { ProjectSkill } from "../entity/project-skill.model";
import { ProjectSupport } from "../entity/project-support.model";
import { Project } from "../entity/project.model";
import { ProjectMapper } from "../mapper/project.mapper";
import { ProjectDataService } from "./project-data.service";

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly data: ProjectDataService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createProject(user: JwtPayload, dto: CreateProjectReqDto): Promise<ProjectResDto> {
    const namespace = this.tenantContext.getTenantId();
    const projectId = randomUUID();

    const project = new Project();
    project.id = projectId;
    project.campusId = namespace;
    project.creatorId = user.sub;
    const dir = await this.data.getDirectoryForUser(namespace, user.sub, user.email);
    if (dir) {
      project.creatorName = dir.fullName || user.email?.split("@")[0] || "Campus Member";
      project.creatorRole = dir.role || null;
      project.creatorUsn = dir.usn || null;
      project.creatorDepartment = dir.department || null;
      project.creatorEmployeeId = dir.role === "FACULTY" ? dir.usn : null;
      project.creatorBatch = dir.batch || null;
    } else {
      project.creatorName = (user as any).name || (user as any).fullName || user.email?.split("@")[0] || "Campus Member";
      project.creatorUsn = (user as any).usn || null;
      const userRoles = (user.roles || []).map((r: string) => r.toUpperCase());
      project.creatorRole = userRoles.includes("FACULTY") ? "FACULTY" : userRoles.includes("ALUMNI") ? "ALUMNI" : "STUDENT";
    }
    project.title = dto.title.trim();
    project.shortDescription = dto.shortDescription.trim();
    project.moreDetails = dto.moreDetails?.trim() || null;
    project.category = dto.category || ProjectCategory.ACADEMIC;
    project.stage = dto.stage;
    project.status = ProjectStatus.OPEN;
    project.duration = dto.duration?.trim() || "3 - 6 Months";
    project.location = dto.location?.trim() || "NMIT North Campus";
    project.visibility = dto.visibility || ProjectVisibility.CAMPUS_ONLY;
    project.bannerUrl = dto.bannerUrl || null;

    let targetAmt = Number(dto.fundingTarget) || 0;
    if (!targetAmt && dto.supportNeeds) {
      for (const s of dto.supportNeeds) {
        if (s.fundingDetails) {
          const match = s.fundingDetails.match(/₹?\s*([\d,]+)/);
          if (match && match[1]) {
            const num = parseFloat(match[1].replace(/,/g, ""));
            if (!isNaN(num) && num > targetAmt) targetAmt = num;
          }
        }
      }
    }
    project.fundingTarget = targetAmt;
    project.fundingRaised = 0;
    project.backersCount = 0;
    project.createdBy = user.sub;
    project.updatedBy = user.sub;

    await this.data.save(namespace, project);

    if (dto.skills && dto.skills.length > 0) {
      const skillsToSave: ProjectSkill[] = dto.skills
        .filter((s) => s && s.trim().length > 0)
        .map((skillName) => {
          const row = new ProjectSkill();
          row.id = randomUUID();
          row.projectId = projectId;
          row.skillName = skillName.trim();
          row.createdBy = user.sub;
          row.updatedBy = user.sub;
          return row;
        });
      await this.data.saveSkills(namespace, skillsToSave);
    }

    if (dto.supportNeeds && dto.supportNeeds.length > 0) {
      const supportsToSave: ProjectSupport[] = dto.supportNeeds.map((s) => {
        const row = new ProjectSupport();
        row.id = randomUUID();
        row.projectId = projectId;
        row.serviceType = s.serviceType;
        row.rolesNeeded = s.rolesNeeded?.trim() || null;
        row.numberOfStudents = s.numberOfStudents?.trim() || null;
        row.commitment = s.commitment?.trim() || null;
        row.preferredSkills = s.preferredSkills?.trim() || null;
        row.mentorDomain = s.mentorDomain?.trim() || null;
        row.fundingDetails = s.fundingDetails?.trim() || null;
        row.createdBy = user.sub;
        row.updatedBy = user.sub;
        return row;
      });
      await this.data.saveSupportNeeds(namespace, supportsToSave);
    }

    if (dto.pdfDocument && typeof dto.pdfDocument === "object") {
      const mediaRow = new ProjectMedia();
      mediaRow.id = randomUUID();
      mediaRow.projectId = projectId;
      mediaRow.mediaType = "DOCUMENT";
      mediaRow.fileUrl = dto.pdfDocument.uri || "";
      mediaRow.fileName = dto.pdfDocument.name || "document.pdf";
      mediaRow.createdBy = user.sub;
      mediaRow.updatedBy = user.sub;
      await this.data.saveMedia(namespace, [mediaRow]);
    }

    const fetched = await this.data.findById(namespace, projectId);
    this.logger.log(`Created project "${project.title}" (${projectId}) on campus ${namespace}`);
    return ProjectMapper.toResponse(fetched!);
  }

  async findAll(user: JwtPayload, query: ProjectQueryDto): Promise<ProjectResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const creatorId = query.mine === "true" || query.mine === "1" ? user.sub : undefined;

    const list = await this.data.findAll(namespace, {
      status: query.status,
      category: query.category,
      search: query.search,
      creatorId,
      domain: query.domain,
      supportOffered: query.supportOffered,
      supportRequired: query.supportRequired,
    });

    return list.map(ProjectMapper.toResponse);
  }

  async findMyProjects(user: JwtPayload): Promise<ProjectResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const list = await this.data.findAll(namespace, {
      creatorId: user.sub,
    });
    return list.map(ProjectMapper.toResponse);
  }

  async findById(id: string): Promise<ProjectResDto> {
    const namespace = this.tenantContext.getTenantId();
    const project = await this.data.findById(namespace, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return ProjectMapper.toResponse(project);
  }

  async updateStatus(
    user: JwtPayload,
    id: string,
    newStatus: ProjectStatus,
  ): Promise<ProjectResDto> {
    const namespace = this.tenantContext.getTenantId();
    const project = await this.data.findById(namespace, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const isOwner = project.creatorId === user.sub;
    const isAdmin =
      user.roles?.includes(ROLES.CAMPUS_ADMIN) ||
      user.roles?.includes(ROLES.SUPER_ADMIN);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException("Only the project creator or an admin can update project status");
    }

    project.status = newStatus;
    project.updatedBy = user.sub;

    await this.data.save(namespace, project);
    this.logger.log(`Updated status of project ${id} to ${newStatus}`);

    const refreshed = await this.data.findById(namespace, id);
    return ProjectMapper.toResponse(refreshed!);
  }

  async deleteProject(user: JwtPayload, id: string): Promise<void> {
    const namespace = this.tenantContext.getTenantId();
    const project = await this.data.findById(namespace, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const isOwner = project.creatorId === user.sub;
    const isAdmin =
      user.roles?.includes(ROLES.CAMPUS_ADMIN) ||
      user.roles?.includes(ROLES.SUPER_ADMIN);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException("Only the project creator or an admin can delete this project");
    }

    await this.data.softDelete(namespace, id, user.sub);
    this.logger.log(`Soft deleted project ${id} by user ${user.sub}`);
  }

  async fundProject(
    user: JwtPayload,
    id: string,
    body: {
      amount: number;
      fundingType: "COLLEGE_FUNDING" | "CROWDFUNDING";
      notes?: string;
      paymentMethod?: string;
      orderId?: string;
    },
  ): Promise<{ contribution: ProjectContributionResDto; project: ProjectResDto }> {
    const namespace = this.tenantContext.getTenantId();
    const project = await this.data.findById(namespace, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException("Contribution amount must be greater than zero");
    }

    const dir = await this.data.getDirectoryForUser(namespace, user.sub, user.email);
    const contributorName =
      dir?.fullName || (user as any).name || (user as any).fullName || user.email?.split("@")[0] || "Campus Member";

    const contrib = new ProjectContribution();
    contrib.id = randomUUID();
    contrib.campusId = namespace;
    contrib.projectId = id;
    contrib.userId = user.sub;
    contrib.contributorName = contributorName;
    contrib.contributorEmail = user.email || null;
    contrib.contributorRole = dir?.role || ((user.roles && user.roles[0]) ? user.roles[0] : "STUDENT");
    contrib.fundingType = body.fundingType || "CROWDFUNDING";
    contrib.amount = amount;
    contrib.paymentMethod = body.paymentMethod || "CAMPUS_PAY";
    contrib.orderId = body.orderId || `ORDER_${Date.now()}`;
    contrib.transactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    contrib.paymentStatus = "VERIFIED";
    contrib.notes = body.notes?.trim() || null;
    contrib.verifiedAt = new Date();
    contrib.createdAt = new Date();

    await this.data.saveContribution(namespace, contrib);

    // Update project metrics
    project.fundingRaised = (Number(project.fundingRaised) || 0) + amount;
    project.backersCount = (Number(project.backersCount) || 0) + 1;
    await this.data.save(namespace, project);

    const refreshed = await this.data.findById(namespace, id);
    return {
      contribution: {
        id: contrib.id,
        projectId: contrib.projectId,
        contributorName: contrib.contributorName,
        contributorRole: contrib.contributorRole,
        fundingType: contrib.fundingType,
        amount: Number(contrib.amount),
        paymentMethod: contrib.paymentMethod,
        transactionId: contrib.transactionId,
        paymentStatus: contrib.paymentStatus,
        createdAt: contrib.createdAt.toISOString(),
      },
      project: ProjectMapper.toResponse(refreshed!),
    };
  }

  async applyToProject(
    user: JwtPayload,
    id: string,
    body: {
      roleApplied: string;
      supportId?: string;
      message?: string;
    },
  ): Promise<ProjectApplicationResDto> {
    const namespace = this.tenantContext.getTenantId();
    const project = await this.data.findById(namespace, id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (!body.roleApplied || !body.roleApplied.trim()) {
      throw new BadRequestException("Role applied is required");
    }

    const dir = await this.data.getDirectoryForUser(namespace, user.sub, user.email);
    const app = new ProjectApplication();
    app.id = randomUUID();
    app.campusId = namespace;
    app.projectId = id;
    app.userId = user.sub;
    app.applicantName =
      dir?.fullName || (user as any).name || (user as any).fullName || user.email?.split("@")[0] || "Campus Member";
    app.applicantEmail = user.email || null;
    app.applicantRole = dir?.role || ((user.roles && user.roles[0]) ? user.roles[0] : "STUDENT");
    app.applicantUsn = dir?.usn || null;
    app.supportId = body.supportId || null;
    app.roleApplied = body.roleApplied.trim();
    app.message = body.message?.trim() || null;
    app.status = "PENDING";
    app.createdAt = new Date();

    const saved = await this.data.saveApplication(namespace, app);
    return {
      id: saved.id,
      projectId: saved.projectId,
      applicantName: saved.applicantName,
      applicantRole: saved.applicantRole,
      applicantUsn: saved.applicantUsn,
      roleApplied: saved.roleApplied,
      message: saved.message,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async getApplications(user: JwtPayload, projectId: string): Promise<ProjectApplicationResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const list = await this.data.findApplications(namespace, projectId);
    return list.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      applicantName: a.applicantName,
      applicantRole: a.applicantRole,
      applicantUsn: a.applicantUsn,
      roleApplied: a.roleApplied,
      message: a.message,
      status: a.status,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
    }));
  }

  async getContributions(user: JwtPayload, projectId: string): Promise<ProjectContributionResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const list = await this.data.findContributions(namespace, projectId);
    return list.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      contributorName: c.contributorName,
      contributorRole: c.contributorRole,
      fundingType: c.fundingType,
      amount: Number(c.amount),
      paymentMethod: c.paymentMethod,
      transactionId: c.transactionId,
      paymentStatus: c.paymentStatus,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
    }));
  }
}
