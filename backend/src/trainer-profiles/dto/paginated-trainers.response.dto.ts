import { ApiProperty } from "@nestjs/swagger";
import { TrainerPublicProfileResponseDto } from "./trainer-public-profile.response.dto";

/**
 * Pagination metadata for the trainers list.
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: "Total number of trainers matching the filters",
    example: 15,
  })
  readonly total: number;

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  readonly page: number;

  @ApiProperty({
    description: "Number of results per page",
    example: 10,
  })
  readonly limit: number;
}

/**
 * Paginated trainers response DTO.
 * Contains a list of public trainer profiles and pagination metadata.
 */
export class PaginatedTrainersResponseDto {
  @ApiProperty({
    description: "List of trainer profiles",
    type: [TrainerPublicProfileResponseDto],
  })
  readonly data: TrainerPublicProfileResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationMetaDto,
  })
  readonly meta: PaginationMetaDto;
}
