import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { TenantConnectionManager } from "./tenant-connection.manager";

@Injectable()
export class DbClientService {
  constructor(private readonly connections: TenantConnectionManager) {}

  async getEntityManager(namespace: string): Promise<EntityManager> {
    const dataSource = await this.connections.getDataSource(namespace);
    return dataSource.manager;
  }
}
