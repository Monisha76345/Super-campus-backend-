import { ApiProperty } from "@nestjs/swagger";

export class UploadDocumentResDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  documentId: number;
}
