import { api } from "./client";
import type {
  TrainingPlanDTO,
  CreatePlanForm,
  PlanStatus,
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
