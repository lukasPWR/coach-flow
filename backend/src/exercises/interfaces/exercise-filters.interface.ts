import { MuscleGroupType } from "./muscle-group.enum";

/**
 * Interface for filtering exercises in repository queries
 */
export interface ExerciseFiltersInterface {
  search?: string;
  muscleGroup?: MuscleGroupType;
}
