import { ref } from "vue";
import type {
  TrainingPlanDetails,
  PlanExercise,
  TrainingPlanDTO,
  PlanStatus,
} from "@/types/training-plans";
import {
  getTrainingPlan,
  getTrainingPlans,
  toggleExerciseCompletion as apiToggleCompletion,
} from "@/lib/api/trainingPlans";

export function useClientPlans() {
  // State for single plan details
  const plan = ref<TrainingPlanDetails | null>(null);

  // State for list of plans
  const plans = ref<TrainingPlanDTO[]>([]);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch list of plans
  const fetchPlans = async (status?: PlanStatus) => {
    isLoading.value = true;
    error.value = null;
    try {
      plans.value = await getTrainingPlans(status);
    } catch (err: any) {
      error.value = err.message || "Failed to load training plans.";
      console.error("Error fetching plans:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch single plan details
  const fetchPlanDetails = async (planId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      plan.value = await getTrainingPlan(planId);
    } catch (err: any) {
      error.value = err.message || "Failed to load training plan.";
      console.error("Error fetching plan details:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const toggleExerciseCompletion = async (exerciseId: string, isCompleted: boolean) => {
    if (!plan.value) return;

    // Find the exercise and its unit to update locally (Optimistic UI)
    let exerciseToUpdate: PlanExercise | undefined;

    for (const unit of plan.value.units) {
      const exercise = unit.exercises.find((e) => e.id === exerciseId);
      if (exercise) {
        exerciseToUpdate = exercise;
        break;
      }
    }

    if (!exerciseToUpdate) return;

    const previousState = exerciseToUpdate.isCompleted;
    exerciseToUpdate.isCompleted = isCompleted;

    try {
      await apiToggleCompletion(exerciseId, isCompleted);
    } catch (err: any) {
      // Revert on error
      exerciseToUpdate.isCompleted = previousState;
      console.error("Error toggling completion:", err);
      // Ideally show a toast here, but we'll return error to caller or handle it globally
      throw err;
    }
  };

  return {
    // State
    plan,
    plans,
    isLoading,
    error,

    // Actions
    fetchPlans,
    fetchPlanDetails,
    toggleExerciseCompletion,
  };
}
