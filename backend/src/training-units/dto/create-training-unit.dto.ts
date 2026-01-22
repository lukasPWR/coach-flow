import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, Min } from "class-validator";

/**
 * DTO for creating a new training unit within a training plan
 */
export class CreateTrainingUnitDto {
  @ApiProperty({
    description: "Name of the training unit",
    example: "Leg Day",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: "Sort order within the plan (defaults to end of list if not provided)",
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
