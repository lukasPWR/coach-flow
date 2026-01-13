import { IsDateString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for query parameters when fetching unavailabilities.
 * Allows filtering by date range.
 */
export class GetUnavailabilitiesQueryDto {
  @ApiPropertyOptional({
    description: "Start date for filtering unavailabilities (ISO8601 format)",
    example: "2024-01-01T00:00:00.000Z",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  readonly from?: string;

  @ApiPropertyOptional({
    description: "End date for filtering unavailabilities (ISO8601 format)",
    example: "2024-01-31T23:59:59.999Z",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  readonly to?: string;
}
