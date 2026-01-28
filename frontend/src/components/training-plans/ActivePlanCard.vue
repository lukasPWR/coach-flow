<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, ArrowRight, Calendar, Activity } from "lucide-vue-next";
import type { TrainingPlanDTO } from "@/types/training-plans";

const props = defineProps<{
  activePlan: TrainingPlanDTO | null;
  loading?: boolean;
}>();

const router = useRouter();

const goToPlan = () => {
  if (props.activePlan) {
    router.push(`/client/plans/${props.activePlan.id}`);
  }
};

const goToAllPlans = () => {
  router.push("/client/plans");
};

const formattedDate = computed(() => {
  if (!props.activePlan?.updatedAt) return "";
  return new Date(props.activePlan.updatedAt).toLocaleDateString("pl-PL");
});
</script>

<template>
  <Card v-if="activePlan" class="border-primary/20 shadow-md">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="text-xl flex items-center gap-2">
            <Dumbbell class="h-5 w-5 text-primary" />
            Aktywny Plan Treningowy
          </CardTitle>
          <CardDescription>
            Twój aktualny plan treningowy przypisany przez trenera.
          </CardDescription>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" class="text-xs h-8" @click="goToAllPlans">
            Wszystkie
          </Button>
          <div class="hidden sm:block">
            <span
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
            >
              Aktywny
            </span>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4 bg-muted/40"
      >
        <div class="space-y-1">
          <h3 class="font-semibold text-lg">{{ activePlan.name }}</h3>
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5" />
              <span>Aktualizacja: {{ formattedDate }}</span>
            </div>
            <!-- Future: Add sessions count or progress here if available -->
          </div>
          <p v-if="activePlan.description" class="text-sm text-muted-foreground line-clamp-2 mt-2">
            {{ activePlan.description }}
          </p>
        </div>

        <Button @click="goToPlan" class="shrink-0 w-full sm:w-auto gap-2">
          Otwórz Plan
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>

  <!-- Empty State / Loading State could be handled here or in parent -->
  <Card v-else-if="loading">
    <CardContent class="p-6 flex items-center justify-center min-h-[150px]">
      <div class="flex flex-col items-center gap-2 text-muted-foreground">
        <Activity class="h-8 w-8 animate-pulse" />
        <p>Ładowanie planu...</p>
      </div>
    </CardContent>
  </Card>
</template>
