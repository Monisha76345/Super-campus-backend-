import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UploadDocumentReqDto {
  @ApiProperty({ type: "string", format: "binary" })
  file: string;

  @ApiProperty({ example: "community" })
  entityType: string;

  @ApiProperty({ example: "post-1" })
  entityId: string;

  @ApiPropertyOptional({ example: "community" })
  refType?: string;

  @ApiPropertyOptional({ example: "1" })
  refId?: string;
}
