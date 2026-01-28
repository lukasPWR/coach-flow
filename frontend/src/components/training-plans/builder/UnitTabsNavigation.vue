<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-vue-next";
import type { TrainingUnit } from "@/types/training-plans";
import { cn } from "@/lib/utils";

defineProps<{
  units: TrainingUnit[];
  activeUnitId: string | null;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "add"): void;
}>();
</script>

<template>
  <div class="flex items-center gap-2 overflow-x-auto p-2 border-b bg-muted/20">
    <button
      v-for="unit in units"
      :key="unit.id"
      :class="
        cn(
          'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
          activeUnitId === unit.id
            ? 'bg-background text-primary shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      "
      @click="emit('select', unit.id)"
    >
      {{ unit.name }}
    </button>

    <Button variant="ghost"
size="sm" class="h-9 px-2 ml-1" @click="emit('add')">
      <Plus class="w-4 h-4 mr-1" />
      Dodaj Dzień
    </Button>
  </div>
</template>
