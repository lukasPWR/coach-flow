<script setup lang="ts">
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrainerFiltersState, SpecializationOption } from "@/types/trainer";

interface Props {
  availableSpecializations: SpecializationOption[];
  currentFilters: TrainerFiltersState;
}

interface Emits {
  "update:city": [value: string];
  "update:specializationId": [value: string | null];
  clear: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local model for city input
const cityModel = computed({
  get: () => props.currentFilters.city,
  set: (value: string) => emit("update:city", value),
});

// Handle specialization change
function handleSpecializationChange(value: string) {
  // If "all" is selected, emit null
  if (value === "all") {
    emit("update:specializationId", null);
  } else {
    emit("update:specializationId", value);
  }
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return props.currentFilters.city !== "" || props.currentFilters.specializationId !== null;
});
</script>

<template>
  <aside class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold mb-4">Filtry</h2>
    </div>

    <!-- City filter -->
    <div class="space-y-2">
      <Label for="city-filter">Miasto</Label>
      <Input
        id="city-filter"
        v-model="cityModel"
        type="text"
        placeholder="Wpisz nazwę miasta..."
        class="w-full"
      />
      <p class="text-xs text-muted-foreground">Wyszukiwanie z opóźnieniem 500ms</p>
    </div>

    <!-- Specialization filter -->
    <div class="space-y-2">
      <Label for="specialization-filter">Specjalizacja</Label>
      <Select
        :model-value="currentFilters.specializationId || 'all'"
        @update:model-value="handleSpecializationChange"
      >
        <SelectTrigger id="specialization-filter" class="w-full">
          <SelectValue placeholder="Wybierz specjalizację" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all"> Wszystkie </SelectItem>
            <SelectItem
              v-for="spec in availableSpecializations"
              :key="spec.value"
              :value="spec.value"
            >
              {{ spec.label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Clear filters button -->
    <div v-if="hasActiveFilters" class="pt-2">
      <Button variant="outline" class="w-full" @click="emit('clear')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
        Wyczyść filtry
      </Button>
    </div>
  </aside>
</template>
