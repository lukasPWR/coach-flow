import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { PlanExerciseResponseDto } from "./plan-exercise-response.dto";

/**
 * Response DTO for training unit with nested exercises
 */
export class TrainingUnitResponseDto {
  @ApiProperty({
    description: "Training unit UUID",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Unit name",
    example: "Push Day",
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Sort order within plan",
    example: 0,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: "List of exercises in this unit",
    type: [PlanExerciseResponseDto],
  })
  @Expose()
  @Type(() => PlanExerciseResponseDto)
  exercises: PlanExerciseResponseDto[];
}
