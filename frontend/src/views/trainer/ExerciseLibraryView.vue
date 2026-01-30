<script setup lang="ts">
import { ref } from "vue";
import { Plus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExerciseFiltersSidebar from "@/components/exercises/ExerciseFiltersSidebar.vue";
import ExerciseListTable from "@/components/exercises/ExerciseListTable.vue";
import ExerciseFormDialog from "@/components/exercises/ExerciseFormDialog.vue";
import { useExercises } from "@/composables/useExercises";
import type { CreateExerciseDto } from "@/types/exercises";

const { exercises, isLoading, filters, createExercise, isCreating, deleteExercise } =
  useExercises();

const isCreateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const exerciseToDeleteId = ref<string | null>(null);

const handleCreate = async (values: CreateExerciseDto) => {
  try {
    await createExercise(values);
    isCreateModalOpen.value = false;
  } catch (error) {
    console.error("Failed to create exercise:", error);
    // W przyszłości można dodać obsługę toastów
  }
};

const confirmDelete = (id: string) => {
  exerciseToDeleteId.value = id;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (exerciseToDeleteId.value) {
    try {
      await deleteExercise(exerciseToDeleteId.value);
      isDeleteModalOpen.value = false;
      exerciseToDeleteId.value = null;
    } catch (error) {
      console.error("Failed to delete exercise:", error);
    }
  }
};
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight">Biblioteka ćwiczeń</h1>
      <Button @click="isCreateModalOpen = true">
        <Plus class="mr-2 h-4 w-4" />
        Dodaj ćwiczenie
      </Button>
    </div>

    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside class="lg:w-1/4">
        <ExerciseFiltersSidebar :filters="filters" @update:filters="filters = $event" />
      </aside>
      <div class="flex-1 lg:max-w-4xl">
        <ExerciseListTable
          :exercises="exercises || []"
          :is-loading="isLoading"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <ExerciseFormDialog
      v-model:open="isCreateModalOpen"
      :is-submitting="isCreating"
      @submit="handleCreate"
    />

    <Dialog v-model:open="isDeleteModalOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Czy na pewno chcesz usunąć to ćwiczenie?</DialogTitle>
          <DialogDescription>
            Tej operacji nie można cofnąć. Ćwiczenie zostanie usunięte z Twojej biblioteki, ale
            pozostanie w historycznych planach treningowych. Nie będziesz mógł go jednak użyć w
            nowych planach.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteModalOpen = false"> Anuluj </Button>
          <Button variant="destructive" @click="handleDelete"> Usuń </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
