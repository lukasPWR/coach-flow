import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for a plan exercise
 * Represents an exercise within a training plan with all its parameters
 */
export class PlanExerciseResponseDto {
  @ApiProperty({
    description: "UUID of the plan exercise entry",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "UUID of the exercise from the library",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Expose()
  exerciseId: string;

  @ApiProperty({
    description: "Name of the exercise (flattened from relation)",
    example: "Bench Press",
  })
  @Expose()
  exerciseName: string;

  @ApiProperty({
    description: "Number of sets",
    example: "3",
    nullable: true,
  })
  @Expose()
  sets: string | null;

  @ApiProperty({
    description: "Number of repetitions",
    example: "8-12",
    nullable: true,
  })
  @Expose()
  reps: string | null;

  @ApiProperty({
    description: "Weight to use",
    example: "20kg",
    nullable: true,
  })
  @Expose()
  weight: string | null;

  @ApiProperty({
    description: "Tempo of execution",
    example: "2010",
    nullable: true,
  })
  @Expose()
  tempo: string | null;

  @ApiProperty({
    description: "Rest period between sets",
    example: "60s",
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
    description: "Sort order within the unit",
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: "Whether the exercise was completed by the client",
    example: false,
  })
  @Expose()
  isCompleted: boolean;
}
