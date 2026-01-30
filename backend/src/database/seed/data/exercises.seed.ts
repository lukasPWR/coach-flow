import { MuscleGroupType } from "../../../exercises/interfaces/muscle-group.enum";

/**
 * Seed data for system exercises
 */
export interface ExerciseSeedData {
  name: string;
  muscleGroup: MuscleGroupType;
  isSystem: boolean;
  trainerId: null;
}

export const EXERCISES_SEED: ExerciseSeedData[] = [
  // CHEST (Klatka piersiowa)
  { name: "Wyciskanie sztangi na ławce płaskiej", muscleGroup: MuscleGroupType.CHEST, isSystem: true, trainerId: null },
  { name: "Wyciskanie hantli na ławce skośnej", muscleGroup: MuscleGroupType.CHEST, isSystem: true, trainerId: null },
  { name: "Rozpiętki z hantlami", muscleGroup: MuscleGroupType.CHEST, isSystem: true, trainerId: null },
  { name: "Pompki klasyczne", muscleGroup: MuscleGroupType.CHEST, isSystem: true, trainerId: null },
  { name: "Wyciskanie na maszynie", muscleGroup: MuscleGroupType.CHEST, isSystem: true, trainerId: null },

  // BACK (Plecy)
  { name: "Martwy ciąg klasyczny", muscleGroup: MuscleGroupType.BACK, isSystem: true, trainerId: null },
  { name: "Podciąganie na drążku", muscleGroup: MuscleGroupType.BACK, isSystem: true, trainerId: null },
  { name: "Wiosłowanie sztangą w opadzie", muscleGroup: MuscleGroupType.BACK, isSystem: true, trainerId: null },
  { name: "Ściąganie drążka wyciągu górnego", muscleGroup: MuscleGroupType.BACK, isSystem: true, trainerId: null },
  { name: "Wiosłowanie jednorącz hantlem", muscleGroup: MuscleGroupType.BACK, isSystem: true, trainerId: null },

  // SHOULDERS (Barki)
  { name: "Wyciskanie sztangi nad głowę", muscleGroup: MuscleGroupType.SHOULDERS, isSystem: true, trainerId: null },
  { name: "Wyciskanie hantli siedząc", muscleGroup: MuscleGroupType.SHOULDERS, isSystem: true, trainerId: null },
  { name: "Unoszenie hantli bokiem", muscleGroup: MuscleGroupType.SHOULDERS, isSystem: true, trainerId: null },
  { name: "Unoszenie hantli w opadzie", muscleGroup: MuscleGroupType.SHOULDERS, isSystem: true, trainerId: null },
  { name: "Face pull", muscleGroup: MuscleGroupType.SHOULDERS, isSystem: true, trainerId: null },

  // BICEPS
  { name: "Uginanie ramion ze sztangą stojąc", muscleGroup: MuscleGroupType.BICEPS, isSystem: true, trainerId: null },
  {
    name: "Uginanie hantli z rotacją (supinacja)",
    muscleGroup: MuscleGroupType.BICEPS,
    isSystem: true,
    trainerId: null,
  },
  { name: "Uginanie na modlitewniku", muscleGroup: MuscleGroupType.BICEPS, isSystem: true, trainerId: null },
  { name: "Uginanie hantli młotkowe", muscleGroup: MuscleGroupType.BICEPS, isSystem: true, trainerId: null },
  { name: "Uginanie na wyciągu dolnym", muscleGroup: MuscleGroupType.BICEPS, isSystem: true, trainerId: null },

  // TRICEPS
  { name: "Wyciskanie francuskie", muscleGroup: MuscleGroupType.TRICEPS, isSystem: true, trainerId: null },
  { name: "Prostowanie ramion na wyciągu", muscleGroup: MuscleGroupType.TRICEPS, isSystem: true, trainerId: null },
  { name: "Pompki na poręczach (dips)", muscleGroup: MuscleGroupType.TRICEPS, isSystem: true, trainerId: null },
  { name: "Wyciskanie wąskim chwytem", muscleGroup: MuscleGroupType.TRICEPS, isSystem: true, trainerId: null },
  { name: "Kickback z hantlem", muscleGroup: MuscleGroupType.TRICEPS, isSystem: true, trainerId: null },

  // FOREARMS (Przedramiona)
  { name: "Uginanie nadgarstków ze sztangą", muscleGroup: MuscleGroupType.FOREARMS, isSystem: true, trainerId: null },
  { name: "Odwrotne uginanie nadgarstków", muscleGroup: MuscleGroupType.FOREARMS, isSystem: true, trainerId: null },
  { name: "Zwijanie liny na wałek", muscleGroup: MuscleGroupType.FOREARMS, isSystem: true, trainerId: null },

  // QUADRICEPS (Czworogłowe uda)
  { name: "Przysiad ze sztangą", muscleGroup: MuscleGroupType.QUADRICEPS, isSystem: true, trainerId: null },
  { name: "Przysiad bułgarski", muscleGroup: MuscleGroupType.QUADRICEPS, isSystem: true, trainerId: null },
  { name: "Wykroki z hantlami", muscleGroup: MuscleGroupType.QUADRICEPS, isSystem: true, trainerId: null },
  { name: "Prostowanie nóg na maszynie", muscleGroup: MuscleGroupType.QUADRICEPS, isSystem: true, trainerId: null },
  { name: "Goblet squat", muscleGroup: MuscleGroupType.QUADRICEPS, isSystem: true, trainerId: null },

  // HAMSTRINGS (Dwugłowe uda)
  { name: "Martwy ciąg rumuński", muscleGroup: MuscleGroupType.HAMSTRINGS, isSystem: true, trainerId: null },
  { name: "Uginanie nóg leżąc na maszynie", muscleGroup: MuscleGroupType.HAMSTRINGS, isSystem: true, trainerId: null },
  { name: "Good morning", muscleGroup: MuscleGroupType.HAMSTRINGS, isSystem: true, trainerId: null },
  { name: "Nordic curl", muscleGroup: MuscleGroupType.HAMSTRINGS, isSystem: true, trainerId: null },

  // GLUTES (Pośladki)
  { name: "Hip thrust ze sztangą", muscleGroup: MuscleGroupType.GLUTES, isSystem: true, trainerId: null },
  { name: "Odwodzenie nogi na wyciągu", muscleGroup: MuscleGroupType.GLUTES, isSystem: true, trainerId: null },
  { name: "Wykroki boczne", muscleGroup: MuscleGroupType.GLUTES, isSystem: true, trainerId: null },
  { name: "Przysiad sumo", muscleGroup: MuscleGroupType.GLUTES, isSystem: true, trainerId: null },
  { name: "Glute bridge", muscleGroup: MuscleGroupType.GLUTES, isSystem: true, trainerId: null },

  // CALVES (Łydki)
  { name: "Wspięcia na palce stojąc", muscleGroup: MuscleGroupType.CALVES, isSystem: true, trainerId: null },
  { name: "Wspięcia na palce siedząc", muscleGroup: MuscleGroupType.CALVES, isSystem: true, trainerId: null },
  { name: "Wspięcia na maszynie", muscleGroup: MuscleGroupType.CALVES, isSystem: true, trainerId: null },

  // ABS (Brzuch)
  { name: "Plank", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },
  { name: "Brzuszki (crunches)", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },
  { name: "Unoszenie nóg w zwisie", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },
  { name: "Russian twist", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },
  { name: "Dead bug", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },
  { name: "Mountain climbers", muscleGroup: MuscleGroupType.ABS, isSystem: true, trainerId: null },

  // CARDIO
  { name: "Bieg na bieżni", muscleGroup: MuscleGroupType.CARDIO, isSystem: true, trainerId: null },
  { name: "Rower stacjonarny", muscleGroup: MuscleGroupType.CARDIO, isSystem: true, trainerId: null },
  { name: "Wioślarz", muscleGroup: MuscleGroupType.CARDIO, isSystem: true, trainerId: null },
  { name: "Skakanka", muscleGroup: MuscleGroupType.CARDIO, isSystem: true, trainerId: null },
  { name: "Burpees", muscleGroup: MuscleGroupType.CARDIO, isSystem: true, trainerId: null },

  // FULL_BODY (Całe ciało)
  { name: "Kettlebell swing", muscleGroup: MuscleGroupType.FULL_BODY, isSystem: true, trainerId: null },
  { name: "Clean and jerk", muscleGroup: MuscleGroupType.FULL_BODY, isSystem: true, trainerId: null },
  { name: "Thruster", muscleGroup: MuscleGroupType.FULL_BODY, isSystem: true, trainerId: null },
  { name: "Turkish get-up", muscleGroup: MuscleGroupType.FULL_BODY, isSystem: true, trainerId: null },
  { name: "Man maker", muscleGroup: MuscleGroupType.FULL_BODY, isSystem: true, trainerId: null },
];
