<script setup lang="ts">
import { computed } from "vue";
// import draggable from 'vuedraggable';
import type { PlanExercise } from "@/types/training-plans";
import PlanExerciseCard from "./PlanExerciseCard.vue";

const props = defineProps<{
  exercises: PlanExercise[];
}>();

const emit = defineEmits<{
  (e: "update-exercise", id: string, data: Partial<PlanExercise>): void;
  (e: "remove-exercise", id: string): void;
  (e: "reorder", exercises: PlanExercise[]): void;
}>();

// Wrapper for v-model
const localExercises = computed({
  get: () => props.exercises,
  set: (val) => emit("reorder", val),
});
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="exercises.length === 0"
      class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg"
      Brak
      ćwiczeń
      w
      tej
      jednostce.
      <
      div
    >
      <!-- 
    <draggable 
        v-model="localExercises" 
        item-key="id"
        handle=".cursor-move"
        ghost-class="opacity-50"
        class="space-y-2"
    >
        <template #item="{ element }">
            <PlanExerciseCard 
                :exercise="element"
                @update="(id, data) => emit('update-exercise', id, data)"
                @remove="(id) => emit('remove-exercise', id)"
            />
        </template>
    </draggable>
    -->

      <!-- Fallback list without drag & drop for debugging -->
      <div class="space-y-2">
        <PlanExerciseCard 
          v-for="element in localExercises"
          :key="element.id"
          :exercise="element"
          @update="(id, data) => emit('update-exercise', id, data)"
          @remove="(id) => emit('remove-exercise', id)"
        />
      </div>
    </div>
  </div>
</template>
