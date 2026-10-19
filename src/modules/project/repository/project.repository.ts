import { EntityManager, FindOptionsWhere, ILike } from "typeorm";
import { Project } from "../entity/project.model";
import { ProjectSkill } from "../entity/project-skill.model";
import { ProjectSupport } from "../entity/project-support.model";
import { ProjectMedia } from "../entity/project-media.model";
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

    if (options?.search) {
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
}
