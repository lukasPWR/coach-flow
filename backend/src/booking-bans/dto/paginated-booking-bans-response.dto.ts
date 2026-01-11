import { ApiProperty } from "@nestjs/swagger";
import { BookingBanResponseDto } from "./booking-ban-response.dto";
import { PaginationMetaDto } from "../../common/dto/pagination-meta.dto";

/**
 * Response DTO for paginated booking bans list.
 *
 * Contains an array of booking bans and pagination metadata.
 */
export class PaginatedBookingBansResponseDto {
  @ApiProperty({
    description: "Array of booking bans for the current page",
    type: [BookingBanResponseDto],
  })
  readonly data: BookingBanResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationMetaDto,
  })
  readonly meta: PaginationMetaDto;

  constructor(data: BookingBanResponseDto[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
