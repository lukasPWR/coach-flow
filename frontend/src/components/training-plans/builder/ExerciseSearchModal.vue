<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// import { ScrollArea } from '@/components/ui/scroll-area'; // REMOVED: Component not available
import { Loader2, Plus, Search } from "lucide-vue-next";
import { getExercises } from "@/lib/api/exercises";
import type { Exercise } from "@/types/exercises";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "select", exercise: Exercise): void;
}>();

const searchQuery = ref("");
const exercises = ref<Exercise[]>([]);
const isLoading = ref(false);

const fetchExercises = async () => {
  isLoading.value = true;
  try {
    exercises.value = await getExercises({ search: searchQuery.value });
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const debouncedSearch = useDebounceFn(fetchExercises, 300);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && exercises.value.length === 0) {
      fetchExercises();
    }
  }
);

const handleSelect = (exercise: Exercise) => {
  emit("select", exercise);
  // Don't close immediately? Or let parent handle it.
  // Usually select and close.
};
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-[500px] h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Dodaj Ćwiczenie</DialogTitle>
        <DialogDescription> Wyszukaj ćwiczenie, aby dodać je do planu. </DialogDescription>
      </DialogHeader>

      <div class="relative">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Szukaj ćwiczeń..." class="pl-8" />
      </div>

      <!-- ScrollArea replaced with div due to missing component -->
      <div class="flex-1 mt-4 -mx-6 px-6 overflow-y-auto">
        <div v-if="isLoading" class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div v-else-if="exercises.length === 0" class="text-center py-8 text-muted-foreground">
          Brak wyników.
        </div>
        <div v-else class="space-y-2 pb-4">
          <button
            v-for="exercise in exercises"
            :key="exercise.id"
            class="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted text-left transition-colors border border-transparent hover:border-border"
            @click="handleSelect(exercise)"
          >
            <div>
              <div class="font-medium">{{ exercise.name }}</div>
              <div class="text-xs text-muted-foreground">{{ exercise.muscleGroup }}</div>
            </div>
            <Plus class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
