import { api } from './client';
import type { CreateExerciseDto, Exercise, ExerciseFilters } from '@/types/exercises';

/**
 * Get all exercises with optional filtering
 */
export async function getExercises(filters?: ExerciseFilters): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.muscleGroup) params.append('muscleGroup', filters.muscleGroup);

  const response = await api.get<Exercise[]>('/exercises', { params });
  return response.data;
}

/**
 * Create a new exercise
 */
export async function createExercise(data: CreateExerciseDto): Promise<Exercise> {
  const response = await api.post<Exercise>('/exercises', data);
  return response.data;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(id: string): Promise<void> {
  await api.delete(`/exercises/${id}`);
}
