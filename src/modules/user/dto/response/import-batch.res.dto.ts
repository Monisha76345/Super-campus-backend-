import { ApiProperty } from "@nestjs/swagger";

export class ImportRowErrorResDto {
  @ApiProperty({ example: 12 })
  row: number;

  @ApiProperty({ example: "Duplicate USN in the file" })
  message: string;
}

export class ImportBatchResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty({ example: "done" })
  status: string;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  createdCount: number;

  @ApiProperty()
  updatedCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ type: [ImportRowErrorResDto] })
  errors: ImportRowErrorResDto[];
}
