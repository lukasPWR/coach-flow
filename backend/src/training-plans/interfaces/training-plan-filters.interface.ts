import { PlanStatus } from "./plan-status.enum";

/**
 * Filters interface for training plans service
 * Used to pass parameters to repository
 */
export interface TrainingPlanFilters {
  trainerId?: string;
  clientId?: string;
  status?: PlanStatus;
}
