import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { getExercises, createExercise, deleteExercise } from "@/lib/api/exercises";
import type { CreateExerciseDto, ExerciseFilters } from "@/types/exercises";

export function useExercises() {
  const queryClient = useQueryClient();
  const filters = ref<ExerciseFilters>({});

  // Query to fetch exercises
  const {
    data: exercises,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["exercises", filters],
    queryFn: () => getExercises(filters.value),
    // Keep previous data while fetching new data to avoid flickering
    placeholderData: (previousData) => previousData,
  });

  // Mutation to create exercise
  const { mutateAsync: createExerciseMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateExerciseDto) => createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });

  // Mutation to delete exercise
  const { mutateAsync: deleteExerciseMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });

  // Helper to update filters with debounce for search could be handled in the component
  // or here if we want to expose a specific method.
  // For now exposing filters ref directly allows flexibility.

  return {
    exercises,
    isLoading,
    isError,
    error,
    filters,
    createExercise: createExerciseMutation,
    isCreating,
    deleteExercise: deleteExerciseMutation,
    isDeleting,
  };
}
