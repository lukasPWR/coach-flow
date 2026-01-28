<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { useRouter } from "vue-router";
import { useClientPlans } from "@/composables/useClientPlans";
import { PlanStatus } from "@/types/training-plans";
import PlanList from "@/components/training-plans/PlanList.vue";
import PlanStatusTabs from "@/components/training-plans/PlanStatusTabs.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-vue-next";

const router = useRouter();
const { plans, isLoading, error, fetchPlans } = useClientPlans();

const activeTab = ref<PlanStatus>(PlanStatus.ACTIVE);

// Pobieranie danych przy zmianie taba
watch(activeTab, (newStatus) => {
  fetchPlans(newStatus);
});

// Inicjalne pobranie
onMounted(() => {
  fetchPlans(activeTab.value);
});

const handlePlanSelect = (planId: string) => {
  router.push(`/client/plans/${planId}`);
};
</script>

<template>
  <div class="container py-8 space-y-8">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Moje Plany</h1>
        <p class="text-muted-foreground mt-1">
          Przeglądaj swoje aktywne i archiwalne plany treningowe.
        </p>
      </div>
      <PlanStatusTabs v-model="activeTab" />
    </div>

    <Alert v-if="error"
variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription> {{ error }}. Spróbuj odświeżyć stronę. </AlertDescription>
    </Alert>

    <PlanList :plans="plans"
:is-loading="isLoading" @select-plan="handlePlanSelect" />
  </div>
</template>
