import { Injectable } from "@nestjs/common";
import { DbClientService } from "src/core/database/db-client.service";
import { ConnectRepository } from "../repository/connect.repository";
import { CampusEvent } from "../entity/campus-event.model";
import { CampusClub } from "../entity/campus-club.model";
import { CampusOpportunity } from "../entity/campus-opportunity.model";
import { CampusConnection, ConnectionStatus } from "../entity/campus-connection.model";
import { EventStatus } from "../entity/enums/event-status.enum";
import { OpportunityType } from "../entity/enums/opportunity-type.enum";
import { UserAccount } from "src/modules/user/entity/user.model";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";
import { UserProfile } from "src/modules/user/entity/profile.model";

@Injectable()
export class ConnectDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<ConnectRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new ConnectRepository(manager);
  }

  async findEvents(namespace: string, status?: EventStatus): Promise<CampusEvent[]> {
    return (await this.repo(namespace)).findEvents(status);
  }

  async createEvent(namespace: string, event: CampusEvent): Promise<CampusEvent> {
    return (await this.repo(namespace)).createEvent(event);
  }

  async findEventById(namespace: string, id: string): Promise<CampusEvent | null> {
    return (await this.repo(namespace)).findEventById(id);
  }

  async findClubs(namespace: string): Promise<CampusClub[]> {
    return (await this.repo(namespace)).findClubs();
  }

  async findOpportunities(namespace: string, type?: OpportunityType): Promise<CampusOpportunity[]> {
    return (await this.repo(namespace)).findOpportunities(type);
  }

  async createOpportunity(namespace: string, opportunity: CampusOpportunity): Promise<CampusOpportunity> {
    return (await this.repo(namespace)).createOpportunity(opportunity);
  }

  async searchMembers(
    namespace: string,
    options: { role?: string; batch?: string; query?: string },
  ): Promise<Array<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null }>> {
    return (await this.repo(namespace)).searchMembers(options);
  }

  async findMemberById(
    namespace: string,
    userId: string,
  ): Promise<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null } | null> {
    return (await this.repo(namespace)).findMemberById(userId);
  }

  async findConnection(
    namespace: string,
    requesterId: string,
    receiverId: string,
  ): Promise<CampusConnection | null> {
    return (await this.repo(namespace)).findConnection(requesterId, receiverId);
  }

  async saveConnection(
    namespace: string,
    connection: CampusConnection,
  ): Promise<CampusConnection> {
    return (await this.repo(namespace)).saveConnection(connection);
  }

  async findConnectionsForUser(
    namespace: string,
    userId: string,
  ): Promise<CampusConnection[]> {
    return (await this.repo(namespace)).findConnectionsForUser(userId);
  }

  async findIncomingRequests(
    namespace: string,
    receiverUserId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    return (await this.repo(namespace)).findIncomingRequests(receiverUserId);
  }

  async findConnectionById(
    namespace: string,
    id: string,
  ): Promise<CampusConnection | null> {
    return (await this.repo(namespace)).findConnectionById(id);
  }

  async updateConnectionStatus(
    namespace: string,
    id: string,
    status: ConnectionStatus,
  ): Promise<CampusConnection | null> {
    return (await this.repo(namespace)).updateConnectionStatus(id, status);
  }

  async findAcceptedConnections(
    namespace: string,
    userId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    return (await this.repo(namespace)).findAcceptedConnections(userId);
  }
}
