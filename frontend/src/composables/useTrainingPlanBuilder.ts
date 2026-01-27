import { ref, computed } from "vue";
import type {
  TrainingPlanDetails,
  TrainingUnit,
  PlanExercise,
  AddExerciseDto,
  ClientSimpleDTO,
} from "@/types/training-plans";
import { PlanStatus } from "@/types/training-plans";
import {
  getTrainingPlan,
  updateTrainingPlan,
  createTrainingUnit,
  deleteTrainingUnit,
  duplicateTrainingUnit,
  updateTrainingUnit,
  addExerciseToUnit as apiAddExerciseToUnit,
  deletePlanExercise,
  updatePlanExercise as apiUpdatePlanExercise,
} from "@/lib/api/trainingPlans";
import { getTrainerClients } from "@/lib/api/trainers";
import type { Exercise } from "@/types/exercises";

export function useTrainingPlanBuilder(planId: string) {
  // State
  const plan = ref<TrainingPlanDetails | null>(null);
  const isLoading = ref(false);
  const savingStatus = ref<"saved" | "saving" | "error">("saved");
  const activeUnitId = ref<string | null>(null);
  const isExerciseModalOpen = ref(false);
  
  const clients = ref<ClientSimpleDTO[]>([]);
  const isLoadingClients = ref(false);

  // Computed
  const activeUnit = computed(() => {
    if (!plan.value || !activeUnitId.value) return null;
    return plan.value.units.find((u) => u.id === activeUnitId.value) || null;
  });

  const logError = (title: string, error: any) => {
      console.error(title, error);
  };

  // Actions
  const loadPlan = async () => {
    isLoading.value = true;
    try {
      const [planData, clientsData] = await Promise.all([
          getTrainingPlan(planId),
          getTrainerClients()
      ]);
      
      plan.value = planData;
      clients.value = clientsData || []; // Ensure array

      // Set initial active unit
      if (plan.value.units.length > 0 && !activeUnitId.value) {
        activeUnitId.value = plan.value.units[0].id;
      }
    } catch (error) {
      logError("Nie udało się załadować planu", error);
    } finally {
      isLoading.value = false;
    }
  };

  const updateHeader = async (data: {
    name?: string;
    clientId?: string;
    status?: PlanStatus;
  }) => {
    if (!plan.value) return;

    const previousData = { ...plan.value };
    if (data.name) plan.value.name = data.name;
    if (data.clientId) plan.value.clientId = data.clientId;
    if (data.status) plan.value.status = data.status;
    
    if (data.clientId) {
        const selectedClient = clients.value.find(c => c.id === data.clientId);
        if (selectedClient) {
            plan.value.clientName = selectedClient.name;
        }
    }

    savingStatus.value = "saving";
    try {
      await updateTrainingPlan(plan.value.id, data);
      savingStatus.value = "saved";
    } catch (error) {
      logError("Nie udało się zaktualizować nagłówka planu", error);
      savingStatus.value = "error";
      plan.value = previousData;
    }
  };

  const addUnit = async () => {
    if (!plan.value) return;
    const sortOrder = plan.value.units.length;
    const name = `Dzień ${plan.value.units.length + 1}`;

    try {
      const newUnit = await createTrainingUnit(plan.value.id, {
        name,
        sortOrder,
      });
      plan.value.units.push(newUnit);
      activeUnitId.value = newUnit.id;
    } catch (error) {
      logError("Nie udało się utworzyć jednostki", error);
    }
  };

  const deleteUnit = async (unitId: string) => {
    if (!plan.value) return;
    if (!confirm("Czy na pewno chcesz usunąć tę jednostkę?")) return;

    try {
      await deleteTrainingUnit(unitId);
      plan.value.units = plan.value.units.filter((u) => u.id !== unitId);
      if (activeUnitId.value === unitId) {
        activeUnitId.value = plan.value.units[0]?.id || null;
      }
    } catch (error) {
      logError("Nie udało się usunąć jednostki", error);
    }
  };

  const duplicateUnit = async (unitId: string) => {
    if (!plan.value) return;
    try {
      const duplicatedUnit = await duplicateTrainingUnit(unitId);
      plan.value.units.push(duplicatedUnit);
      activeUnitId.value = duplicatedUnit.id;
    } catch (error) {
      logError("Nie udało się zduplikować jednostki", error);
    }
  };
  
    const updateUnitName = async (unitId: string, name: string) => {
        if (!plan.value) return;
        const unit = plan.value.units.find(u => u.id === unitId);
        if (!unit) return;

        const previousName = unit.name;
        unit.name = name;
        savingStatus.value = "saving";

        try {
            await updateTrainingUnit(unitId, { name });
            savingStatus.value = "saved";
        } catch (error) {
             unit.name = previousName;
             savingStatus.value = "error";
        }
    }

  const addExerciseToUnit = async (exerciseBase: Exercise) => {
    if (!activeUnitId.value || !plan.value) return;

    const unit = plan.value.units.find((u) => u.id === activeUnitId.value);
    if (!unit) return;

    const sortOrder = unit.exercises.length;
    const dto: AddExerciseDto = {
      exerciseId: exerciseBase.id,
      sortOrder,
    };

    try {
      const newExercise = await apiAddExerciseToUnit(
        activeUnitId.value,
        dto
      );
      unit.exercises.push(newExercise);
      isExerciseModalOpen.value = false;
    } catch (error) {
      logError("Nie udało się dodać ćwiczenia", error);
    }
  };

  const removeExercise = async (exerciseId: string) => {
     if (!activeUnitId.value || !plan.value) return;
      const unit = plan.value.units.find(u => u.id === activeUnitId.value);
      if(!unit) return;

      const previousExercises = [...unit.exercises];
      unit.exercises = unit.exercises.filter(e => e.id !== exerciseId);

      try {
          await deletePlanExercise(exerciseId);
      } catch (error) {
          unit.exercises = previousExercises;
          logError("Nie udało się usunąć ćwiczenia", error);
      }
  };

  const updateExercise = async (exerciseId: string, data: Partial<PlanExercise>) => {
       if (!activeUnitId.value || !plan.value) return;
      const unit = plan.value.units.find(u => u.id === activeUnitId.value);
      if(!unit) return;
      
      const exercise = unit.exercises.find(e => e.id === exerciseId);
      if(!exercise) return;

      Object.assign(exercise, data);
      savingStatus.value = "saving";

      try {
          await apiUpdatePlanExercise(exerciseId, data);
          savingStatus.value = "saved";
      } catch (error) {
          savingStatus.value = "error";
      }
  };
  
  const reorderExercises = async (newExercises: PlanExercise[]) => {
      if (!activeUnitId.value || !plan.value) return;
      const unit = plan.value.units.find(u => u.id === activeUnitId.value);
      if(!unit) return;
      
      unit.exercises = newExercises;
      
      savingStatus.value = "saving";
      try {
          const updates = newExercises.map((ex, index) => {
              if (ex.sortOrder !== index) {
                   ex.sortOrder = index;
                   return apiUpdatePlanExercise(ex.id, { sortOrder: index });
              }
              return Promise.resolve();
          });
          await Promise.all(updates);
          savingStatus.value = "saved";
      } catch (error) {
          savingStatus.value = "error";
      }
  }

  return {
    plan,
    clients,
    isLoading,
    savingStatus,
    activeUnitId,
    activeUnit,
    isExerciseModalOpen,
    loadPlan,
    updateHeader,
    addUnit,
    deleteUnit,
    duplicateUnit,
    updateUnitName,
    addExerciseToUnit,
    removeExercise,
    updateExercise,
    reorderExercises
  };
}
