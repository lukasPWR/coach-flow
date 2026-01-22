import { PartialType, OmitType } from "@nestjs/swagger";
import { CreatePlanExerciseDto } from "./create-plan-exercise.dto";

/**
 * DTO for updating training parameters of an exercise in a plan
 * Allows partial update of all fields except exerciseId
 * To change the exercise itself, delete and add a new one
 */
export class UpdatePlanExerciseDto extends PartialType(OmitType(CreatePlanExerciseDto, ["exerciseId"] as const)) {}
