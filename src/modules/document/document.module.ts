import { Module, OnModuleInit } from "@nestjs/common";
import { DocumentMetaInfo } from "src/common/document-uploader/models/documentmetainfo.model";
import { registerEntities } from "src/core/database/entities.registry";
import { Document } from "./entity/document.model";
import { DocumentDataService } from "./service/document-data.service";

@Module({
  providers: [DocumentDataService],
  exports: [DocumentDataService],
})
export class DocumentModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([Document, DocumentMetaInfo]);
  }
}
