import { IsBoolean, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for toggling the completion status of a plan exercise
 * Clients use this to mark exercises as completed or not completed
 */
export class TogglePlanExerciseCompletionDto {
  @ApiProperty({
    description: "Whether the exercise has been completed by the client",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
