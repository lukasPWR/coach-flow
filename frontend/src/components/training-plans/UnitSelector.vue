<script setup lang="ts">
import type { TrainingUnit } from "@/types/training-plans";
import { Button } from "@/components/ui/button";

defineProps<{
  units: TrainingUnit[];
  selectedUnitId: string;
}>();

const emit = defineEmits<{
  (e: "update:selectedUnitId", id: string): void;
}>();

const selectUnit = (id: string) => {
  emit("update:selectedUnitId", id);
};
</script>

<template>
  <div class="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
    <div class="flex gap-2 min-w-max">
      <Button
        v-for="unit in units"
        :key="unit.id"
        :variant="selectedUnitId === unit.id ? 'default' : 'outline'"
        class="whitespace-nowrap rounded-full"
        @click="selectUnit(unit.id)"
      >
        {{ unit.name }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-x-auto {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
