import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Readable } from "stream";
import { BufferedFile } from "src/common/s3-client/file.model";
import { S3ClientService } from "src/common/s3-client/s3-client.service";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { UploadDocumentReqDto } from "src/modules/document/dto/request/upload-document.req.dto";
import { DocumentUploaderService } from "../services/document-uploader.service";

@ApiTags("Document Uploader")
@ApiBearerAuth()
@ApiSecurity("tenant-id")
@Controller("document-uploader")
@UseGuards(JwtAuthGuard)
export class DocumentUploaderController {
  constructor(
    private readonly documentUploaderService: DocumentUploaderService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: S3ClientService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadDocumentReqDto })
  @ApiOperation({ summary: "Upload a document to MinIO and store its record" })
  async upload(
    @UploadedFile() file: BufferedFile,
    @Body("entityType") entityType: string,
    @Body("entityId") entityId: string,
    @Body("refType") refType: string,
    @Body("refId") refId: string,
    @Query("entityType") qEntityType: string,
    @Query("entityId") qEntityId: string,
    @Query("refType") qRefType: string,
    @Query("refId") qRefId: string,
  ) {
    const et = entityType || qEntityType;
    const ei = entityId || qEntityId;
    const rt = refType || qRefType;
    const ri = refId || qRefId;
    if (!file) {
      throw new BadRequestException("File is required");
    }
    if (!et || !ei) {
      throw new BadRequestException("entityType and entityId are required");
    }
    const result = await this.documentUploaderService.uploadFile(this.tenantContext.getTenantId(), file, {
      entityType: et,
      entityId: ei,
      refType: rt || "other",
      refId: ri || "1",
    });
    return ApiResponseDto.success(result, "Document uploaded successfully");
  }

  @Get("get-all-files")
  @ApiOperation({ summary: "List files for an entity" })
  async getAll(
    @Query("entityType") entityType: string,
    @Query("entityId") entityId: string,
    @Query("refType") refType?: string,
    @Query("refId") refId?: string,
  ) {
    if (!entityType || !entityId) {
      throw new BadRequestException("entityType and entityId are required");
    }
    const result = await this.documentUploaderService.getDocuments(this.tenantContext.getTenantId(), {
      entityType,
      entityId,
      refType,
      refId,
    });
    return ApiResponseDto.success(result, "Success");
  }

  @Get("preview")
  @ApiOperation({ summary: "Preview a document by storage key" })
  async preview(@Query("key") key: string, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException("key is required");
    }
    try {
      const metaData = await this.storage.getMetaData(key);
      const data = await this.storage.downloadFile(key);
      res.set({
        "Content-Type": metaData.mimetype || "application/octet-stream",
        "Content-Disposition": `inline; filename="${metaData.filename || "file"}"`,
      });
      if (data.Body instanceof Readable) {
        data.Body.pipe(res);
        return;
      }
      if (data.Body && typeof (data.Body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
        const bytes = await (data.Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
        res.send(Buffer.from(bytes));
        return;
      }
      throw new HttpException("Document body is empty", HttpStatus.NOT_FOUND);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete a document and remove the stored file" })
  async delete(@Param("id") id: string) {
    const result = await this.documentUploaderService.deleteDocument(this.tenantContext.getTenantId(), id);
    return ApiResponseDto.success(result, "Deleted successfully");
  }
}
