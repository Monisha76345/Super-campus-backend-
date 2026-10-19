import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { Project } from "../entity/project.model";
import { ProjectSkill } from "../entity/project-skill.model";
import { ProjectSupport } from "../entity/project-support.model";
import { ProjectMedia } from "../entity/project-media.model";
import { ProjectRepository } from "../repository/project.repository";
import { ProjectStatus } from "../entity/enums/project-status.enum";
import { ProjectCategory } from "../entity/enums/project-category.enum";

@Injectable()
export class ProjectDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<ProjectRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new ProjectRepository(manager);
  }

  async save(namespace: string, row: Project): Promise<Project> {
    return (await this.repo(namespace)).save(row);
  }

  async saveSkills(namespace: string, skills: ProjectSkill[]): Promise<ProjectSkill[]> {
    return (await this.repo(namespace)).saveSkills(skills);
  }

  async saveSupportNeeds(namespace: string, supports: ProjectSupport[]): Promise<ProjectSupport[]> {
    return (await this.repo(namespace)).saveSupportNeeds(supports);
  }

  async saveMedia(namespace: string, media: ProjectMedia[]): Promise<ProjectMedia[]> {
    return (await this.repo(namespace)).saveMedia(media);
  }

  async findById(namespace: string, id: string): Promise<Project | null> {
    return (await this.repo(namespace)).findById(id);
  }

  async findAll(
    namespace: string,
    options?: {
      status?: ProjectStatus;
      category?: ProjectCategory;
      search?: string;
      creatorId?: string;
    },
  ): Promise<Project[]> {
    return (await this.repo(namespace)).findAll(options);
  }

  async softDelete(namespace: string, id: string, actorId: string): Promise<void> {
    return (await this.repo(namespace)).softDelete(id, actorId);
  }
}
