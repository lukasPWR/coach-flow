import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { MuscleGroupType } from "../interfaces/muscle-group.enum";

export class ExerciseResponseDto {
  @ApiProperty({
    description: "Unique identifier of the exercise",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Name of the exercise",
    example: "Bench Press",
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Target muscle group",
    enum: MuscleGroupType,
    example: MuscleGroupType.CHEST,
  })
  @Expose()
  muscleGroup: MuscleGroupType;

  @ApiProperty({
    description: "Indicates if the exercise is a system exercise (available to all trainers)",
    example: true,
  })
  @Expose()
  isSystem: boolean;

  @ApiProperty({
    description: "UUID of the trainer who created the exercise (null for system exercises)",
    example: "987fcdeb-51a2-43f1-a567-987654321000",
    nullable: true,
  })
  @Expose()
  trainerId: string | null;

  @ApiProperty({
    description: "Date when the exercise was created",
    example: "2024-01-15T10:30:00Z",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Date when the exercise was last updated",
    example: "2024-01-15T10:30:00Z",
  })
  @Expose()
  updatedAt: Date;
}
