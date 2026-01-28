<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-vue-next";
import { MUSCLE_GROUP_LABELS } from "@/types/exercises";
import type { Exercise } from "@/types/exercises";

defineProps<{
  exercises: Exercise[];
  isLoading: boolean;
}>();

defineEmits<{
  (e: "delete", id: string): void;
}>();
</script>

<template>
  <div class="rounded-md border">
    <table class="w-full caption-bottom text-sm">
      <thead class="[&_tr]:border-b">
        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
          >
            Nazwa
          </th>
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
          >
            Partia mięśniowa
          </th>
          <th
            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
          >
            Źródło
          </th>
          <th
            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
          >
            Akcje
          </th>
        </tr>
      </thead>
      <tbody class="[&_tr:last-child]:border-0">
        <tr v-if="isLoading" class="border-b transition-colors hover:bg-muted/50">
          <td colspan="4" class="p-4 text-center text-muted-foreground">Ładowanie...</td>
        </tr>
        <tr v-else-if="exercises.length === 0" class="border-b transition-colors hover:bg-muted/50">
          <td colspan="4" class="p-4 text-center text-muted-foreground">
            Brak ćwiczeń spełniających kryteria.
          </td>
        </tr>
        <tr
          v-else
          v-for="exercise in exercises"
          :key="exercise.id"
          class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        >
          <td class="p-4 align-middle font-medium">
            {{ exercise.name }}
          </td>
          <td class="p-4 align-middle">
            {{ MUSCLE_GROUP_LABELS[exercise.muscleGroup] }}
          </td>
          <td class="p-4 align-middle">
            <Badge :variant="exercise.isSystem ? 'secondary' : 'default'">
              {{ exercise.isSystem ? "Systemowe" : "Własne" }}
            </Badge>
          </td>
          <td class="p-4 align-middle text-right">
            <Button
              v-if="!exercise.isSystem"
              variant="ghost"
              size="icon"
              @click="$emit('delete', exercise.id)"
            >
              <Trash2 class="h-4 w-4 text-destructive" />
              <span class="sr-only">Usuń</span>
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
