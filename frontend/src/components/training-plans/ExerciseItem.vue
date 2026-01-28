<script setup lang="ts">
import type { PlanExercise } from "@/types/training-plans";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-vue-next";

defineProps<{
  exercise: PlanExercise;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-expand"): void;
  (e: "toggle-completion", isCompleted: boolean): void;
}>();

const onCheckboxChange = (checked: boolean) => {
  emit("toggle-completion", checked);
};
</script>

<template>
  <div class="border-b last:border-b-0">
    <div
      class="sticky top-0 z-10 bg-background flex items-center justify-between p-4 cursor-pointer"
      @click="emit('toggle-expand')"
    >
      <div class="flex items-center gap-3 flex-1">
        <div @click.stop>
          <Checkbox :checked="exercise.isCompleted" @update:checked="onCheckboxChange" />
        </div>
        <span class="font-medium text-base">{{ exercise.exerciseName }}</span>
      </div>
      <ChevronDown
        class="h-5 w-5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <div v-show="isOpen" class="p-4 pt-0 bg-muted/20 space-y-4">
      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <span class="text-xs text-muted-foreground uppercase">Sets</span>
          <p class="text-2xl font-bold">{{ exercise.sets || "-" }}</p>
        </div>
        <div class="space-y-1">
          <span class="text-xs text-muted-foreground uppercase">Reps</span>
          <p class="text-2xl font-bold">{{ exercise.reps || "-" }}</p>
        </div>
        <div class="space-y-1" v-if="exercise.weight">
          <span class="text-xs text-muted-foreground uppercase">Weight</span>
          <p class="text-lg font-semibold">{{ exercise.weight }}</p>
        </div>
        <div class="space-y-1" v-if="exercise.rpe">
          <span class="text-xs text-muted-foreground uppercase">RPE</span>
          <p class="text-lg font-semibold">{{ exercise.rpe }}</p>
        </div>
        <div class="space-y-1" v-if="exercise.tempo">
          <span class="text-xs text-muted-foreground uppercase">Tempo</span>
          <p class="text-lg font-semibold">{{ exercise.tempo }}</p>
        </div>
        <div class="space-y-1" v-if="exercise.rest">
          <span class="text-xs text-muted-foreground uppercase">Rest</span>
          <p class="text-lg font-semibold">{{ exercise.rest }}</p>
        </div>
      </div>

      <div
        v-if="exercise.notes"
        class="mt-4 p-3 bg-background rounded-md border text-sm text-muted-foreground"
      >
        <p>{{ exercise.notes }}</p>
      </div>
    </div>
  </div>
</template>
