// Enums
export enum MuscleGroupType {
  CHEST = "CHEST",
  BACK = "BACK",
  SHOULDERS = "SHOULDERS",
  BICEPS = "BICEPS",
  TRICEPS = "TRICEPS",
  LEGS = "LEGS",
  CORE = "CORE",
  GLUTES = "GLUTES",
  FOREARMS = "FOREARMS",
  CARDIO = "CARDIO",
  FULL_BODY = "FULL_BODY",
}

// DTOs
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupType;
  isSystem: boolean;
  trainerId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExerciseDto {
  name: string;
  muscleGroup: MuscleGroupType;
}

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: MuscleGroupType;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroupType, string> = {
  [MuscleGroupType.CHEST]: "Klatka piersiowa",
  [MuscleGroupType.BACK]: "Plecy",
  [MuscleGroupType.SHOULDERS]: "Barki",
  [MuscleGroupType.BICEPS]: "Biceps",
  [MuscleGroupType.TRICEPS]: "Triceps",
  [MuscleGroupType.LEGS]: "Nogi",
  [MuscleGroupType.CORE]: "Brzuch",
  [MuscleGroupType.GLUTES]: "Pośladki",
  [MuscleGroupType.FOREARMS]: "Przedramiona",
  [MuscleGroupType.CARDIO]: "Cardio",
  [MuscleGroupType.FULL_BODY]: "Całe ciało",
};
