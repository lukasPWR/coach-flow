<script setup lang="ts">
import { type ITrainingPlan } from "@/types/training-plans";
import PlanTile from "./PlanTile.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { FileQuestion } from "lucide-vue-next";

defineProps<{
  plans: ITrainingPlan[];
  isLoading: boolean;
}>();

defineEmits<{
  (e: "select-plan", id: string): void;
}>();
</script>

<template>
  <div v-if="isLoading"
class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="n in 6"
:key="n" class="h-full">
      <div class="flex flex-col space-y-3 h-full border rounded-xl p-6 bg-card">
        <div class="flex justify-between items-start">
          <Skeleton class="h-[24px] w-3/4 rounded-md" />
          <Skeleton class="h-[20px] w-[60px] rounded-full" />
        </div>
        <div class="space-y-2 mt-4 flex-grow">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
        </div>
        <div class="flex items-center pt-4 mt-auto">
          <Skeleton class="h-4 w-1/3" />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="plans.length === 0"
    class="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10 border-dashed"
  >
    <div class="bg-background p-4 rounded-full mb-4 shadow-sm">
      <FileQuestion class="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 class="text-lg font-semibold">Brak planów treningowych</h3>
    <p class="text-sm text-muted-foreground mt-2 max-w-sm">
      W tej kategorii nie ma obecnie żadnych przypisanych planów.
    </p>
  </div>

  <div v-else
class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <PlanTile
      v-for="plan in plans"
      :key="plan.id"
      :plan="plan"
      @click="$emit('select-plan', plan.id)"
    />
  </div>
</template>
