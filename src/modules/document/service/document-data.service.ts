import { Injectable } from "@nestjs/common";
import { FindOptionsWhere } from "typeorm";
import { DbClientService } from "src/core/database/db-client.service";
import { DocumentMetaInfo } from "src/common/document-uploader/models/documentmetainfo.model";
import { Document } from "../entity/document.model";
import { DocumentRepository } from "../repository/document.repository";

@Injectable()
export class DocumentDataService {
  constructor(private readonly dbClient: DbClientService) {}

  private async repo(namespace: string): Promise<DocumentRepository> {
    const manager = await this.dbClient.getEntityManager(namespace);
    return new DocumentRepository(manager);
  }

  async saveMeta(namespace: string, meta: Partial<DocumentMetaInfo>): Promise<DocumentMetaInfo> {
    return (await this.repo(namespace)).saveMeta(meta);
  }

  async findMeta(namespace: string, where: FindOptionsWhere<DocumentMetaInfo>): Promise<DocumentMetaInfo[]> {
    return (await this.repo(namespace)).findMeta(where);
  }

  async findMetaById(namespace: string, id: string): Promise<DocumentMetaInfo | null> {
    return (await this.repo(namespace)).findMetaById(id);
  }

  async removeMeta(namespace: string, id: string): Promise<void> {
    await (await this.repo(namespace)).removeMeta(id);
  }

  async softRemoveMeta(namespace: string, entity: DocumentMetaInfo): Promise<void> {
    await (await this.repo(namespace)).softRemoveMeta(entity);
  }

  async saveDocument(namespace: string, doc: Partial<Document>): Promise<Document> {
    return (await this.repo(namespace)).saveDocument(doc);
  }

  async findDocumentByLocation(namespace: string, location: string): Promise<Document | null> {
    return (await this.repo(namespace)).findDocumentByLocation(location);
  }

  async softRemoveDocument(namespace: string, entity: Document): Promise<void> {
    await (await this.repo(namespace)).softRemoveDocument(entity);
  }
}
