<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTrainingPlanBuilder } from '@/composables/useTrainingPlanBuilder';

import PlanHeader from '@/components/training-plans/builder/PlanHeader.vue';
import UnitTabsNavigation from '@/components/training-plans/builder/UnitTabsNavigation.vue';
import ActiveUnitEditor from '@/components/training-plans/builder/ActiveUnitEditor.vue';
import ExerciseSearchModal from '@/components/training-plans/builder/ExerciseSearchModal.vue';
import { Loader2 } from 'lucide-vue-next';

const route = useRoute();
const planId = route.params.id as string;

const {
  plan,
  isLoading,
  savingStatus,
  activeUnitId,
  activeUnit,
  isExerciseModalOpen,
  clients,
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
} = useTrainingPlanBuilder(planId);

onMounted(async () => {
    await loadPlan();
});

</script>

<template>
    <div class="flex flex-col h-[calc(100vh-4rem)] bg-background">
        <div v-if="isLoading && !plan" class="flex items-center justify-center flex-1">
             <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        
        <template v-else-if="plan">
            <PlanHeader 
                :plan="plan" 
                :clients="clients"
                :saving-status="savingStatus"
                @update="updateHeader"
            />

            <div class="flex-1 flex flex-col overflow-hidden">
                <UnitTabsNavigation 
                    :units="plan.units" 
                    :active-unit-id="activeUnitId"
                    @select="(id) => activeUnitId = id"
                    @add="addUnit"
                />
                
                <div class="flex-1 overflow-hidden relative">
                    <ActiveUnitEditor 
                        v-if="activeUnit"
                        :key="activeUnit.id"
                        :unit="activeUnit"
                        @update="updateUnitName"
                        @duplicate="duplicateUnit"
                        @delete="deleteUnit"
                        @add-exercise="isExerciseModalOpen = true"
                        @update-exercise="updateExercise"
                        @remove-exercise="removeExercise"
                        @reorder="reorderExercises"
                    />
                    <div v-else class="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                        <p class="mb-4">Brak jednostek treningowych.</p>
                        <p class="text-sm">Kliknij "Dodaj Dzień", aby rozpocząć tworzenie planu.</p>
                    </div>
                </div>
            </div>
            
            <ExerciseSearchModal 
                v-model:open="isExerciseModalOpen"
                @select="addExerciseToUnit"
            />
        </template>
        
        <div v-else class="flex items-center justify-center flex-1 text-destructive">
            Nie udało się załadować planu.
        </div>
    </div>
</template>
