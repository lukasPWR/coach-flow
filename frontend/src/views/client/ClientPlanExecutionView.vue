<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-vue-next";
import { useClientPlans } from "@/composables/useClientPlans";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UnitSelector from "@/components/training-plans/UnitSelector.vue";
import ExerciseList from "@/components/training-plans/ExerciseList.vue";

const route = useRoute();
const router = useRouter();
const planId = route.params.id as string;

const { plan, isLoading, error, fetchPlanDetails, toggleExerciseCompletion } = useClientPlans();

const selectedUnitId = ref<string>("");

const loadData = async () => {
  await fetchPlanDetails(planId);
  if (plan.value && plan.value.units.length > 0) {
    // Select first unit by default if not already selected
    if (!selectedUnitId.value) {
      selectedUnitId.value = plan.value.units[0].id;
    }
  }
};

const goBack = () => {
  router.push({ name: "client-plans" });
};

onMounted(() => {
  loadData();
});

// Watch for selected unit changes or ensure it stays valid
watch(
  () => plan.value,
  (newPlan) => {
    if (newPlan && newPlan.units.length > 0 && !selectedUnitId.value) {
      selectedUnitId.value = newPlan.units[0].id;
    }
  }
);
</script>

<template>
  <div class="container max-w-lg mx-auto py-4 space-y-6 min-h-[calc(100vh-4rem)]">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost"
size="icon" @click="goBack">
        <ArrowLeft class="h-5 w-5" />
      </Button>
      <div v-if="plan"
class="flex-1">
        <h1 class="text-xl font-bold truncate">
          {{ plan.name }}
        </h1>
        <p v-if="plan.description" class="text-sm text-muted-foreground">
          {{ plan.description }}
        </p>
      </div>
      <div v-else-if="isLoading"
class="flex-1 space-y-2">
        <div class="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div class="h-4 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </div>

    <!-- Error State -->
    <Alert v-if="error"
variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription class="flex flex-col gap-2">
        <p>{{ error }}</p>
        <Button variant="outline"
size="sm" class="w-fit" @click="loadData">
          Spróbuj ponownie
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div v-else-if="isLoading"
class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="plan && plan.units.length === 0"
      class="text-center py-12 text-muted-foreground"
    >
      <p>Ten plan nie ma jeszcze żadnych jednostek treningowych.</p>
    </div>

    <!-- Content -->
    <div v-else-if="plan"
class="space-y-6">
      <!-- Unit Selector -->
      <UnitSelector
        v-if="plan.units.length > 0"
        v-model:selected-unit-id="selectedUnitId"
        :units="plan.units"
      />

      <!-- Exercise List -->
      <div v-if="selectedUnitId">
        <ExerciseList
          :exercises="plan.units.find((u) => u.id === selectedUnitId)?.exercises || []"
          @toggle-completion="toggleExerciseCompletion"
        />
      </div>
    </div>
  </div>
</template>
