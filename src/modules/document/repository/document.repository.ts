import { EntityManager, FindOptionsWhere } from "typeorm";
import { DocumentMetaInfo } from "src/common/document-uploader/models/documentmetainfo.model";
import { Document } from "../entity/document.model";

export class DocumentRepository {
  constructor(private readonly manager: EntityManager) {}

  saveMeta(meta: Partial<DocumentMetaInfo>): Promise<DocumentMetaInfo> {
    const repo = this.manager.getRepository(DocumentMetaInfo);
    return repo.save(repo.create(meta));
  }

  findMeta(where: FindOptionsWhere<DocumentMetaInfo>): Promise<DocumentMetaInfo[]> {
    return this.manager.getRepository(DocumentMetaInfo).find({ where });
  }

  findMetaById(id: string): Promise<DocumentMetaInfo | null> {
    return this.manager.getRepository(DocumentMetaInfo).findOne({ where: { id } });
  }

  async removeMeta(id: string): Promise<void> {
    await this.manager.getRepository(DocumentMetaInfo).delete(id);
  }

  async softRemoveMeta(entity: DocumentMetaInfo): Promise<void> {
    await this.manager.getRepository(DocumentMetaInfo).softRemove(entity);
  }

  saveDocument(doc: Partial<Document>): Promise<Document> {
    const repo = this.manager.getRepository(Document);
    return repo.save(repo.create(doc));
  }

  findDocumentByLocation(location: string): Promise<Document | null> {
    return this.manager.getRepository(Document).findOne({ where: { location } });
  }

  async softRemoveDocument(entity: Document): Promise<void> {
    await this.manager.getRepository(Document).softRemove(entity);
  }
}
