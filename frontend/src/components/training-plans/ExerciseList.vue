<script setup lang="ts">
import { ref } from "vue";
import type { PlanExercise } from "@/types/training-plans";
import ExerciseItem from "./ExerciseItem.vue";

defineProps<{
  exercises: PlanExercise[];
}>();

const emit = defineEmits<{
  (e: "toggle-completion", exerciseId: string, isCompleted: boolean): void;
}>();

const expandedExerciseId = ref<string | null>(null);

const handleToggleExpand = (id: string) => {
  if (expandedExerciseId.value === id) {
    expandedExerciseId.value = null;
  } else {
    expandedExerciseId.value = id;
  }
};

const handleToggleCompletion = (exerciseId: string, isCompleted: boolean) => {
  emit("toggle-completion", exerciseId, isCompleted);
};
</script>

<template>
  <div class="border rounded-lg bg-card text-card-foreground shadow-sm">
    <ExerciseItem
      v-for="exercise in exercises"
      :key="exercise.id"
      :exercise="exercise"
      :is-open="expandedExerciseId === exercise.id"
      @toggle-expand="handleToggleExpand(exercise.id)"
      @toggle-completion="(isCompleted) => handleToggleCompletion(exercise.id, isCompleted)"
    />
  </div>
</template>
