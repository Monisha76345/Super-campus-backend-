import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { OutpassRequest } from "../entity/outpass.model";
import { OutpassRepository } from "../repository/outpass.repository";

@Injectable()
export class OutpassDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<OutpassRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new OutpassRepository(manager);
  }

  async save(namespace: string, row: OutpassRequest): Promise<OutpassRequest> {
    return (await this.repo(namespace)).save(row);
  }

  async findById(namespace: string, id: string): Promise<OutpassRequest | null> {
    return (await this.repo(namespace)).findById(id);
  }

  async findByStudentId(namespace: string, studentId: string): Promise<OutpassRequest[]> {
    return (await this.repo(namespace)).findByStudentId(studentId);
  }

  async findAll(namespace: string, limit = 100): Promise<OutpassRequest[]> {
    return (await this.repo(namespace)).findAll(limit);
  }

  async findByQrTokenOrId(namespace: string, token: string): Promise<OutpassRequest | null> {
    return (await this.repo(namespace)).findByQrTokenOrId(token);
  }
}
