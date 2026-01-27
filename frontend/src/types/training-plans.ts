export enum PlanStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

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
