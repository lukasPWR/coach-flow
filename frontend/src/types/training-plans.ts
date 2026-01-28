export enum PlanStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
}

export type ITrainingPlan = TrainingPlanDTO; // Alias for plan compliance

export interface TrainingPlanDTO {
  id: string;
  trainerId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  // Optional flattened fields if backend provides them or we map them
  clientName?: string;
  clientAvatar?: string;
}

export interface ClientSimpleDTO {
  id: string;
  name: string; // Combined first/last name or just name
  email: string;
  avatarUrl?: string;
}

export interface CreatePlanForm {
  name: string;
  clientId: string;
  description?: string;
}

export interface TrainingPlanViewModel extends TrainingPlanDTO {
  lastModifiedFormatted: string;
  clientAvatarInitials: string;
  clientName: string;
}

// --- Builder Types ---

export interface PlanExercise {
  id: string; // ID instancji w planie
  trainingUnitId: string;
  exerciseId: string; // ID definicji ćwiczenia
  exerciseName: string; // Spłaszczone dla wygody
  muscleGroup?: string; // Opcjonalnie do wyświetlania ikon
  sets: string | null;
  reps: string | null;
  weight: string | null;
  rpe: string | null; // Opcjonalne
  tempo: string | null;
  rest: string | null;
  notes: string | null;
  sortOrder: number;
  isCompleted: boolean;
}

export interface TrainingUnit {
  id: string;
  planId?: string; // Optional in some contexts
  name: string;
  sortOrder: number;
  exercises: PlanExercise[];
}

export interface TrainingPlanDetails {
  id: string;
  name: string;
  status: PlanStatus;
  clientId: string | null;
  clientName?: string;
  description?: string | null;
  units: TrainingUnit[];
  createdAt: string;
  updatedAt: string;
}

// For API requests
export interface UpdatePlanDto {
  name?: string;
  clientId?: string;
  status?: PlanStatus;
  description?: string;
}

export interface CreateUnitDto {
  name: string;
  sortOrder?: number;
}

export interface UpdateUnitDto {
  name?: string;
  sortOrder?: number;
}

export interface AddExerciseDto {
  exerciseId: string;
  sets?: string;
  reps?: string;
  weight?: string;
  rpe?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdatePlanExerciseDto {
  sets?: string;
  reps?: string;
  weight?: string;
  rpe?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  sortOrder?: number;
}
