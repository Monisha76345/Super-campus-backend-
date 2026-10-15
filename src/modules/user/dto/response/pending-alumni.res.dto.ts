import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "src/core/common/dto/pagination-meta.dto";
import { DirectoryResDto } from "./directory.res.dto";

export class PendingAlumniPageResDto {
  @ApiProperty({ type: [DirectoryResDto] })
  data: DirectoryResDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
