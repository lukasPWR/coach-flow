import { api } from "./client";
import type {
  TrainingPlanDTO,
  CreatePlanForm,
  PlanStatus,
  TrainingPlanDetails,
  UpdatePlanDto,
  CreateUnitDto,
  TrainingUnit,
  UpdateUnitDto,
  AddExerciseDto,
  PlanExercise,
  UpdatePlanExerciseDto,
} from "@/types/training-plans";

const BASE_URL = "/training-plans";

export async function getTrainingPlans(
  status?: PlanStatus,
  clientId?: string
): Promise<TrainingPlanDTO[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (clientId) params.clientId = clientId;

  const response = await api.get<TrainingPlanDTO[]>(BASE_URL, { params });
  return response.data;
}

export async function createTrainingPlan(
  data: CreatePlanForm
): Promise<TrainingPlanDTO> {
  const response = await api.post<TrainingPlanDTO>(BASE_URL, data);
  return response.data;
}

export async function getTrainingPlan(id: string): Promise<TrainingPlanDetails> {
  const response = await api.get<TrainingPlanDetails>(`${BASE_URL}/${id}`);
  return response.data;
}

export async function updateTrainingPlan(
  id: string,
  data: UpdatePlanDto
): Promise<TrainingPlanDTO> {
  const response = await api.patch<TrainingPlanDTO>(`${BASE_URL}/${id}`, data);
  return response.data;
}

// Units
export async function createTrainingUnit(
  planId: string,
  data: CreateUnitDto
): Promise<TrainingUnit> {
  const response = await api.post<TrainingUnit>(
    `${BASE_URL}/${planId}/units`,
    data
  );
  return response.data;
}

export async function duplicateTrainingUnit(unitId: string): Promise<TrainingUnit> {
  const response = await api.post<TrainingUnit>(
    `/training-units/${unitId}/duplicate`
  );
  return response.data;
}

export async function updateTrainingUnit(
  unitId: string,
  data: UpdateUnitDto
): Promise<TrainingUnit> {
  const response = await api.patch<TrainingUnit>(
    `/training-units/${unitId}`,
    data
  );
  return response.data;
}

export async function deleteTrainingUnit(unitId: string): Promise<void> {
  await api.delete(`/training-units/${unitId}`);
}

// Exercises
export async function addExerciseToUnit(
  unitId: string,
  data: AddExerciseDto
): Promise<PlanExercise> {
  const response = await api.post<PlanExercise>(
    `/training-units/${unitId}/exercises`,
    data
  );
  return response.data;
}

export async function updatePlanExercise(
  exerciseId: string,
  data: UpdatePlanExerciseDto
): Promise<PlanExercise> {
  const response = await api.patch<PlanExercise>(
    `/plan-exercises/${exerciseId}`,
    data
  );
  return response.data;
}

export async function deletePlanExercise(exerciseId: string): Promise<void> {
  await api.delete(`/plan-exercises/${exerciseId}`);
}

export async function toggleExerciseCompletion(
  exerciseId: string,
  isCompleted: boolean
): Promise<PlanExercise> {
  const response = await api.patch<PlanExercise>(
    `/plan-exercises/${exerciseId}/completion`,
    { isCompleted }
  );
  return response.data;
}

// Clients (helper for header) - REMOVED: Use getTrainerClients from @/lib/api/trainers instead
// export async function getTrainerClients()...
