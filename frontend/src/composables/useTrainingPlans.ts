import { ref } from "vue";
import { getTrainingPlans, createTrainingPlan } from "@/lib/api/trainingPlans";
import { getTrainerClients } from "@/lib/api/trainers";
import {
  PlanStatus,
  type TrainingPlanDTO,
  type CreatePlanForm,
  type ClientSimpleDTO,
} from "@/types/training-plans";

export function useTrainingPlans() {
  const plans = ref<TrainingPlanDTO[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filterStatus = ref<PlanStatus>(PlanStatus.ACTIVE);

  const clients = ref<ClientSimpleDTO[]>([]);
  const isLoadingClients = ref(false);

  const fetchPlans = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      plans.value = await getTrainingPlans(filterStatus.value);
    } catch (e: any) {
      error.value = e.message || "Failed to fetch training plans";
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchClients = async () => {
    isLoadingClients.value = true;
    try {
      clients.value = await getTrainerClients();
    } catch (e: any) {
      console.error("Failed to fetch clients", e);
    } finally {
      isLoadingClients.value = false;
    }
  };

  const createPlan = async (data: CreatePlanForm) => {
    isLoading.value = true;
    try {
      await createTrainingPlan(data);
      await fetchPlans(); // Refresh list
      return true;
    } catch (e: any) {
      error.value = e.message || "Failed to create training plan";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    plans,
    isLoading,
    error,
    filterStatus,
    clients,
    isLoadingClients,
    fetchPlans,
    fetchClients,
    createPlan,
  };
}
