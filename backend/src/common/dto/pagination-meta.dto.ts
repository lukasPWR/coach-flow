import { ApiProperty } from "@nestjs/swagger";

/**
 * Metadata for paginated responses.
 *
 * Contains information about the current page and total items.
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: "Total number of items across all pages",
    example: 42,
  })
  readonly totalItems: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
  })
  readonly itemsPerPage: number;

  @ApiProperty({
    description: "Current page number (1-indexed)",
    example: 1,
  })
  readonly currentPage: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 5,
  })
  readonly totalPages: number;

  constructor(totalItems: number, itemsPerPage: number, currentPage: number) {
    this.totalItems = totalItems;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(totalItems / itemsPerPage);
  }
}
