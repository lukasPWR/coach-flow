import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Query parameters for finding trainers with pagination and filtering.
 * Used for the public GET /trainers endpoint.
 */
export class FindTrainersQueryDto {
  @ApiProperty({
    description: "Page number for pagination",
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiProperty({
    description: "Number of results per page",
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 10;

  @ApiProperty({
    description: "Filter trainers by city (case-insensitive)",
    example: "Warszawa",
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiProperty({
    description: "Filter trainers by specialization ID",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  readonly specializationId?: string;
}
