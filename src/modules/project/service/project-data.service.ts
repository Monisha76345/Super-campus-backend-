import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { Project } from "../entity/project.model";
import { ProjectSkill } from "../entity/project-skill.model";
import { ProjectSupport } from "../entity/project-support.model";
import { ProjectMedia } from "../entity/project-media.model";
import { ProjectContribution } from "../entity/project-contribution.model";
import { ProjectApplication } from "../entity/project-application.model";
import { ProjectRepository } from "../repository/project.repository";
import { ProjectStatus } from "../entity/enums/project-status.enum";
import { ProjectCategory } from "../entity/enums/project-category.enum";

@Injectable()
export class ProjectDataService {
  constructor(private readonly dbClient: DbClientService) {}

  async getDirectoryForUser(namespace: string, userId?: string, email?: string): Promise<any> {
    try {
      const manager = await this.dbClient.getEntityManager(namespace);
      const rows = await manager.query(
        "SELECT fullName, usn, role, department, batch FROM campus_directory WHERE (userId = ? AND ? != '') OR (collegeEmail = ? AND ? != '') LIMIT 1",
        [userId || '', userId || '', email || '', email || '']
      );
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch {
      return null;
    }
  }

  async getAllDirectoriesMap(namespace: string): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    try {
      const manager = await this.dbClient.getEntityManager(namespace);
      const rows = await manager.query(
        "SELECT userId, collegeEmail, fullName, usn, role, department, batch FROM campus_directory"
      );
      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (r.userId) map.set(r.userId, r);
          if (r.collegeEmail) map.set(r.collegeEmail.toLowerCase(), r);
          if (r.usn) map.set(r.usn.toLowerCase(), r);
        }
      }
    } catch {}
    return map;
  }

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
      domain?: string;
      supportOffered?: string;
      supportRequired?: string;
    },
  ): Promise<Project[]> {
    return (await this.repo(namespace)).findAll(options);
  }

  async softDelete(namespace: string, id: string, actorId: string): Promise<void> {
    return (await this.repo(namespace)).softDelete(id, actorId);
  }

  async saveContribution(namespace: string, contrib: ProjectContribution): Promise<ProjectContribution> {
    return (await this.repo(namespace)).saveContribution(contrib);
  }

  async findContributions(namespace: string, projectId: string): Promise<ProjectContribution[]> {
    return (await this.repo(namespace)).findContributions(projectId);
  }

  async saveApplication(namespace: string, app: ProjectApplication): Promise<ProjectApplication> {
    return (await this.repo(namespace)).saveApplication(app);
  }

  async findApplications(namespace: string, projectId: string): Promise<ProjectApplication[]> {
    return (await this.repo(namespace)).findApplications(projectId);
  }
}
