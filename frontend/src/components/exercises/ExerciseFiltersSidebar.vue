<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MuscleGroupType, MUSCLE_GROUP_LABELS } from '@/types/exercises';
import type { ExerciseFilters } from '@/types/exercises';
import { Search, X } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const props = defineProps<{
  filters: ExerciseFilters;
}>();

const emit = defineEmits<{
  (_e: 'update:filters', _filters: ExerciseFilters): void;
}>();

const searchQuery = ref(props.filters.search || '');
const selectedMuscleGroup = ref<MuscleGroupType | 'ALL'>((props.filters.muscleGroup as MuscleGroupType) || 'ALL');

const updateFilters = useDebounceFn(() => {
  const newFilters: ExerciseFilters = {
    ...props.filters,
    search: searchQuery.value || undefined,
    muscleGroup: selectedMuscleGroup.value === 'ALL' ? undefined : selectedMuscleGroup.value,
  };
  emit('update:filters', newFilters);
}, 300);

watch(searchQuery, () => updateFilters());
watch(selectedMuscleGroup, () => updateFilters());

const clearFilters = () => {
  searchQuery.value = '';
  selectedMuscleGroup.value = 'ALL';
  // updateFilters will be triggered by watchers
};
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <Label>Wyszukaj</Label>
      <div class="relative">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Szukaj ćwiczenia..."
          class="pl-8"
        />
      </div>
    </div>

    <div class="space-y-2">
      <Label>Partia mięśniowa</Label>
      <Select v-model="selectedMuscleGroup">
        <SelectTrigger>
          <SelectValue placeholder="Wybierz partię" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Wszystkie</SelectItem>
          <SelectItem
            v-for="(label, key) in MUSCLE_GROUP_LABELS"
            :key="key"
            :value="key"
          >
            {{ label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Button
      v-if="searchQuery || selectedMuscleGroup !== 'ALL'"
      variant="ghost"
      class="w-full"
      @click="clearFilters"
    >
      <X class="mr-2 h-4 w-4" />
      Wyczyść filtry
    </Button>
  </div>
</template>
