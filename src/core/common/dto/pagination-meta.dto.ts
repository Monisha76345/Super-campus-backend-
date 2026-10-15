import { ApiProperty } from "@nestjs/swagger";

export class PaginationMetaDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  firstPage: number;

  @ApiProperty()
  lastPage: number;

  @ApiProperty()
  itemCount: number;

  static from(totalItems: number, currentPage: number, itemsPerPage: number, itemCount: number): PaginationMetaDto {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);
    const meta = new PaginationMetaDto();
    meta.totalItems = totalItems;
    meta.totalPages = totalPages;
    meta.currentPage = currentPage;
    meta.itemsPerPage = itemsPerPage;
    meta.itemCount = itemCount;
    meta.hasNextPage = currentPage < totalPages && totalItems > 0;
    meta.hasPreviousPage = currentPage > 1;
    meta.firstPage = 1;
    meta.lastPage = totalPages;
    return meta;
  }
}
