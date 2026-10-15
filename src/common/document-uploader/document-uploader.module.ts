import { Module } from "@nestjs/common";
import { DocumentModule } from "src/modules/document/document.module";
import { S3ClientModule } from "../s3-client/s3-client.module";
import { DocumentUploaderController } from "./controller/document-uploader.controller";
import { DocumentUploaderService } from "./services/document-uploader.service";

@Module({
  imports: [S3ClientModule, DocumentModule],
  controllers: [DocumentUploaderController],
  providers: [DocumentUploaderService],
  exports: [DocumentUploaderService],
})
export class DocumentUploaderModule {}
