import { IsUUID, IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for adding an exercise to a training unit
 * Note: trainingUnitId is obtained from URL parameter (/training-units/:unitId/exercises)
 */
export class CreatePlanExerciseDto {
  @ApiProperty({
    description: "UUID of the exercise from the library",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty({
    description: 'Number of sets (e.g., "3" or "3-4")',
    example: "3",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sets?: string;

  @ApiProperty({
    description: 'Number of repetitions or range (e.g., "10" or "8-12")',
    example: "8-12",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reps?: string;

  @ApiProperty({
    description: 'Weight to use (e.g., "20kg" or "RPE 8")',
    example: "20kg",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weight?: string;

  @ApiProperty({
    description: 'Tempo of execution (e.g., "2010")',
    example: "2010",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tempo?: string;

  @ApiProperty({
    description: 'Rest period between sets (e.g., "60s")',
    example: "60s",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rest?: string;

  @ApiProperty({
    description: "Additional notes for the client",
    example: "Focus on form, control the negative",
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: "Sort order within the unit (if not provided, added at the end)",
    example: 1,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
