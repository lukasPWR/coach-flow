import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

/**
 * Response DTO for plan exercise within a training unit
 * Contains flattened exercise name and all exercise parameters
 */
export class PlanExerciseResponseDto {
  @ApiProperty({
    description: "Plan exercise UUID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Exercise UUID from library",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Expose()
  exerciseId: string;

  @ApiProperty({
    description: "Exercise name (flattened from exercise relation)",
    example: "Bench Press",
  })
  @Expose()
  exerciseName: string;

  @ApiProperty({
    description: "Number of sets",
    example: "4",
    nullable: true,
  })
  @Expose()
  sets: string | null;

  @ApiProperty({
    description: "Number of repetitions or range",
    example: "8-12",
    nullable: true,
  })
  @Expose()
  reps: string | null;

  @ApiProperty({
    description: "Weight specification",
    example: "80kg",
    nullable: true,
  })
  @Expose()
  weight: string | null;

  @ApiProperty({
    description: "Exercise tempo",
    example: "3-1-1-0",
    nullable: true,
  })
  @Expose()
  tempo: string | null;

  @ApiProperty({
    description: "Rest time between sets",
    example: "90s",
    nullable: true,
  })
  @Expose()
  rest: string | null;

  @ApiProperty({
    description: "Additional notes",
    example: "Focus on form",
    nullable: true,
  })
  @Expose()
  notes: string | null;

  @ApiProperty({
    description: "Sort order within unit",
    example: 0,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: "Completion status (for clients)",
    example: false,
  })
  @Expose()
  isCompleted: boolean;
}
