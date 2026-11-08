import { EntityManager } from "typeorm";
import { Project } from "../entity/project.model";
import { ProjectSkill } from "../entity/project-skill.model";
import { ProjectSupport } from "../entity/project-support.model";
import { ProjectMedia } from "../entity/project-media.model";
import { ProjectContribution } from "../entity/project-contribution.model";
import { ProjectApplication } from "../entity/project-application.model";
import { ProjectStatus } from "../entity/enums/project-status.enum";
import { ProjectCategory } from "../entity/enums/project-category.enum";

export class ProjectRepository {
  constructor(private readonly manager: EntityManager) {}

  async save(row: Project): Promise<Project> {
    return this.manager.getRepository(Project).save(row);
  }

  async saveSkills(skills: ProjectSkill[]): Promise<ProjectSkill[]> {
    if (!skills.length) return [];
    return this.manager.getRepository(ProjectSkill).save(skills);
  }

  async saveSupportNeeds(supports: ProjectSupport[]): Promise<ProjectSupport[]> {
    if (!supports.length) return [];
    return this.manager.getRepository(ProjectSupport).save(supports);
  }

  async saveMedia(media: ProjectMedia[]): Promise<ProjectMedia[]> {
    if (!media.length) return [];
    return this.manager.getRepository(ProjectMedia).save(media);
  }

  async findById(id: string): Promise<Project | null> {
    return this.manager.getRepository(Project).findOne({
      where: { id },
      relations: ["skills", "supportNeeds", "media"],
    });
  }

  async findAll(options?: {
    status?: ProjectStatus;
    category?: ProjectCategory;
    search?: string;
    creatorId?: string;
    domain?: string;
    supportOffered?: string;
    supportRequired?: string;
  }): Promise<Project[]> {
    const qb = this.manager
      .getRepository(Project)
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.skills", "skills")
      .leftJoinAndSelect("project.supportNeeds", "supportNeeds")
      .leftJoinAndSelect("project.media", "media")
      .orderBy("project.createdAt", "DESC");

    if (options?.status) {
      qb.andWhere("project.status = :status", { status: options.status });
    }

    if (options?.category) {
      qb.andWhere("project.category = :category", { category: options.category });
    }

    if (options?.creatorId) {
      qb.andWhere("project.creatorId = :creatorId", { creatorId: options.creatorId });
    }

    if (options?.domain && options.domain.trim()) {
      const dTerm = `%${options.domain.trim()}%`;
      qb.andWhere(
        "(skills.skillName LIKE :dTerm OR project.title LIKE :dTerm OR project.shortDescription LIKE :dTerm OR project.moreDetails LIKE :dTerm)",
        { dTerm },
      );
    }

    if (options?.supportOffered && options.supportOffered.trim()) {
      const offered = options.supportOffered.trim().toUpperCase();
      if (offered === "ALL" || offered === "ANY") {
        qb.andWhere(
          "supportNeeds.serviceType IN ('HIRE_STUDENTS', 'HIRE_MENTOR')"
        );
      } else {
        qb.andWhere("supportNeeds.serviceType = :offered", { offered });
      }
    }

    if (options?.supportRequired && options.supportRequired.trim()) {
      const req = options.supportRequired.trim().toUpperCase();
      if (req === "ALL" || req === "ANY") {
        qb.andWhere(
          "supportNeeds.serviceType IN ('COLLEGE_FUNDING', 'CROWDFUNDING')"
        );
      } else {
        qb.andWhere("supportNeeds.serviceType = :req", { req });
      }
    }

    if (options?.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      qb.andWhere(
        "(project.title LIKE :term OR project.shortDescription LIKE :term OR project.moreDetails LIKE :term OR skills.skillName LIKE :term)",
        { term },
      );
    }

    return qb.getMany();
  }

  async softDelete(id: string, actorId: string): Promise<void> {
    await this.manager.getRepository(Project).update(id, {
      deletedBy: actorId,
    });
    await this.manager.getRepository(Project).softDelete(id);
  }

  async saveContribution(contrib: ProjectContribution): Promise<ProjectContribution> {
    return this.manager.getRepository(ProjectContribution).save(contrib);
  }

  async findContributions(projectId: string): Promise<ProjectContribution[]> {
    return this.manager
      .getRepository(ProjectContribution)
      .createQueryBuilder("c")
      .where("c.projectId = :projectId", { projectId })
      .orderBy("c.createdAt", "DESC")
      .getMany();
  }

  async saveApplication(app: ProjectApplication): Promise<ProjectApplication> {
    return this.manager.getRepository(ProjectApplication).save(app);
  }

  async findApplications(projectId: string): Promise<ProjectApplication[]> {
    return this.manager
      .getRepository(ProjectApplication)
      .createQueryBuilder("a")
      .where("a.projectId = :projectId", { projectId })
      .orderBy("a.createdAt", "DESC")
      .getMany();
  }
}
