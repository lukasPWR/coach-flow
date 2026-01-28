<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash2, Plus } from "lucide-vue-next";
import type { TrainingUnit, PlanExercise } from "@/types/training-plans";
import ExerciseEditorList from "./ExerciseEditorList.vue";

const props = defineProps<{
  unit: TrainingUnit;
}>();

const emit = defineEmits<{
  (e: "update", id: string, name: string): void;
  (e: "duplicate", id: string): void;
  (e: "delete", id: string): void;
  (e: "add-exercise"): void;
  (e: "update-exercise", id: string, data: Partial<PlanExercise>): void;
  (e: "remove-exercise", id: string): void;
  (e: "reorder", exercises: PlanExercise[]): void;
}>();

const localName = ref(props.unit.name);

watch(
  () => props.unit.name,
  (newVal) => {
    if (newVal !== localName.value) {
      localName.value = newVal;
    }
  }
);

const debouncedUpdate = useDebounceFn((name: string) => {
  emit("update", props.unit.id, name);
}, 500);

const handleNameInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  localName.value = val;
  debouncedUpdate(val);
};
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-4 border-b">
      <Input
        v-model="localName"
        class="font-medium max-w-sm"
        placeholder="Nazwa jednostki (np. Dzień Push)"
        @input="handleNameInput"
      />
      <div class="flex items-center gap-2">
        <Button variant="outline"
size="sm" @click="emit('duplicate', unit.id)">
          <Copy class="w-4 h-4 mr-2" />
          Duplikuj
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          @click="emit('delete', unit.id)"
        >
          <Trash2 class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-4 bg-muted/10">
      <ExerciseEditorList
        :exercises="unit.exercises"
        @update-exercise="(id, data) => emit('update-exercise', id, data)"
        @remove-exercise="(id) => emit('remove-exercise', id)"
        @reorder="(exercises) => emit('reorder', exercises)"
      />

      <Button
        variant="outline"
        class="w-full mt-4 border-dashed py-8 text-muted-foreground hover:text-primary hover:border-primary"
        @click="emit('add-exercise')"
      >
        <Plus class="w-5 h-5 mr-2" />
        Dodaj Ćwiczenie
      </Button>
    </div>
  </div>
</template>
