import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { CampusDirectory } from "../entity/campus-directory.model";
import { GlobalLogin } from "../entity/global-login.model";
import { ImportBatch } from "../entity/import-batch.model";
import { UserProfile } from "../entity/profile.model";
import { UserAccount } from "../entity/user.model";
import { UserRepository } from "../repository/user.repository";

@Injectable()
export class UserDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<UserRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new UserRepository(manager);
  }

  async transaction<T>(namespace: string, work: (repo: UserRepository) => Promise<T>): Promise<T> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return manager.transaction((tx) => work(new UserRepository(tx)));
  }

  async saveDirectory(namespace: string, row: CampusDirectory): Promise<CampusDirectory> {
    return (await this.repo(namespace)).saveDirectory(row);
  }

  async findDirectoryById(namespace: string, id: string): Promise<CampusDirectory | null> {
    return (await this.repo(namespace)).findDirectoryById(id);
  }

  async findDirectoryByUsn(namespace: string, usn: string): Promise<CampusDirectory | null> {
    return (await this.repo(namespace)).findDirectoryByUsn(usn);
  }

  async findDirectoryByCollegeEmail(namespace: string, collegeEmail: string): Promise<CampusDirectory | null> {
    return (await this.repo(namespace)).findDirectoryByCollegeEmail(collegeEmail);
  }

  async findPendingAlumni(namespace: string, page: number, limit: number): Promise<[CampusDirectory[], number]> {
    return (await this.repo(namespace)).findPendingAlumni(page, limit);
  }

  async saveUser(namespace: string, row: UserAccount): Promise<UserAccount> {
    return (await this.repo(namespace)).saveUser(row);
  }

  async findUserById(namespace: string, id: string): Promise<UserAccount | null> {
    return (await this.repo(namespace)).findUserById(id);
  }

  async findUserByDirectoryId(namespace: string, directoryId: string): Promise<UserAccount | null> {
    return (await this.repo(namespace)).findUserByDirectoryId(directoryId);
  }

  async findUserByLoginId(namespace: string, loginId: string): Promise<UserAccount | null> {
    return (await this.repo(namespace)).findUserByLoginId(loginId);
  }

  async saveBatch(namespace: string, row: ImportBatch): Promise<ImportBatch> {
    return (await this.repo(namespace)).saveBatch(row);
  }

  async saveGlobalLogin(namespace: string, row: GlobalLogin): Promise<GlobalLogin> {
    return (await this.repo(namespace)).saveGlobalLogin(row);
  }

  async findGlobalByLoginId(namespace: string, loginId: string): Promise<GlobalLogin | null> {
    return (await this.repo(namespace)).findGlobalByLoginId(loginId);
  }

  async findGlobalByDirectory(namespace: string, tenantId: string, directoryId: string): Promise<GlobalLogin | null> {
    return (await this.repo(namespace)).findGlobalByDirectory(tenantId, directoryId);
  }

  async removeGlobalLogin(namespace: string, id: string): Promise<void> {
    await (await this.repo(namespace)).removeGlobalLogin(id);
  }

  async saveProfile(namespace: string, row: UserProfile): Promise<UserProfile> {
    return (await this.repo(namespace)).saveProfile(row);
  }

  async findProfileByUserId(namespace: string, userId: string): Promise<UserProfile | null> {
    return (await this.repo(namespace)).findProfileByUserId(userId);
  }

  async findProfileByHandle(namespace: string, handle: string): Promise<UserProfile | null> {
    return (await this.repo(namespace)).findProfileByHandle(handle);
  }
}
