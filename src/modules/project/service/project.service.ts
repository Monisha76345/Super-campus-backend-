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
import { ProjectResDto } from "../dto/response/project.res.dto";
import { ProjectCategory } from "../entity/enums/project-category.enum";
import { ProjectStatus } from "../entity/enums/project-status.enum";
import { ProjectVisibility } from "../entity/enums/project-visibility.enum";
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
    project.creatorName = (user as any).name || (user as any).fullName || null;
    project.creatorUsn = (user as any).usn || null;
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
}
