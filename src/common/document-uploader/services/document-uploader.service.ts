import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { BufferedFile } from "src/common/s3-client/file.model";
import { S3ClientService } from "src/common/s3-client/s3-client.service";
import { getAuditContext } from "src/core/audit/audit-context";
import { DocumentRefType } from "src/modules/document/entity/enums/document-ref-type.enum";
import { DocumentStatus } from "src/modules/document/entity/enums/document-status.enum";
import { DocumentType } from "src/modules/document/entity/enums/document-type.enum";
import { DocumentDataService } from "src/modules/document/service/document-data.service";

@Injectable()
export class DocumentUploaderService {
  private readonly logger = new Logger(DocumentUploaderService.name);

  constructor(
    private readonly storage: S3ClientService,
    private readonly documents: DocumentDataService,
  ) {}

  async uploadFile(
    namespace: string,
    file: BufferedFile,
    meta: { entityType: string; entityId: string; refType: string; refId: string },
  ) {
    const audit = getAuditContext();
    const savedMeta = await this.documents.saveMeta(namespace, {
      entityType: meta.entityType,
      entityId: meta.entityId,
      refType: meta.refType,
      refId: meta.refId,
      userId: audit.userId ?? null,
      createdBy: audit.userId ?? null,
      updatedBy: audit.userId ?? null,
    });
    const key = savedMeta.id;

    try {
      await this.storage.uploadBuffer(key, file.buffer, {
        "Content-Type": file.mimetype,
        "x-amz-meta-filename": (file.originalname ?? "").replace(/[^a-zA-Z0-9.]/g, ""),
        "x-amz-meta-mimetype": file.mimetype,
        "x-amz-meta-entityid": meta.entityId,
        "x-amz-meta-entitytype": meta.entityType,
        "x-amz-meta-refid": meta.refId,
        "x-amz-meta-reftype": meta.refType,
        "x-amz-meta-id": key,
      });

      const refType = this.toRefType(meta.refType);
      const doc = await this.documents.saveDocument(namespace, {
        name: this.uniqueName(file.originalname, key),
        refId: meta.refId,
        refType,
        type: file.mimetype.startsWith("image/") ? DocumentType.IMAGE : DocumentType.FILE,
        mimeType: file.mimetype.slice(0, 127),
        location: key,
        contentId: meta.entityId,
        url: key,
        status: DocumentStatus.ACTIVE,
        createdBy: audit.userId ?? null,
        updatedBy: audit.userId ?? null,
      });

      return {
        key,
        fileName: file.originalname,
        url: key,
        documentId: doc.id,
      };
    } catch (err) {
      this.logger.error(`Upload failed for ${key}: ${(err as Error).message}`, (err as Error).stack);
      await this.documents.removeMeta(namespace, key);
      throw err;
    }
  }

  async getDocuments(
    namespace: string,
    criteria: { entityType: string; entityId: string; refType?: string; refId?: string },
  ) {
    return this.documents.findMeta(namespace, {
      entityType: criteria.entityType,
      entityId: criteria.entityId,
      ...(criteria.refType ? { refType: criteria.refType } : {}),
      ...(criteria.refId ? { refId: criteria.refId } : {}),
    });
  }

  async deleteDocument(namespace: string, key: string) {
    const doc = await this.documents.findMetaById(namespace, key);
    if (!doc) {
      throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
    }
    const audit = getAuditContext();
    if (audit.userId) {
      doc.deletedBy = audit.userId;
      doc.updatedBy = audit.userId;
    }
    await this.storage.delete(key);
    await this.documents.softRemoveMeta(namespace, doc);
    const record = await this.documents.findDocumentByLocation(namespace, key);
    if (record) {
      if (audit.userId) {
        record.deletedBy = audit.userId;
        record.updatedBy = audit.userId;
      }
      await this.documents.softRemoveDocument(namespace, record);
    }
    return { message: "Deleted successfully" };
  }

  private toRefType(value: string): DocumentRefType {
    const match = Object.values(DocumentRefType).find((item) => item === value);
    return match ?? DocumentRefType.OTHER;
  }

  private uniqueName(originalName: string, key: string): string {
    const safe = (originalName || "file").replace(/[^a-zA-Z0-9.]/g, "").slice(0, 60);
    return `${key.slice(0, 8)}-${safe}`.slice(0, 100);
  }
}
