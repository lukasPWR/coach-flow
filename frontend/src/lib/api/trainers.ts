import { api } from './client'
import type {
  GetTrainersQueryParams,
  GetTrainersResponse,
  SpecializationOption,
  TrainerProfileDto,
} from '@/types/trainer'

/**
 * Fetch trainers list with optional filters and pagination
 */
export async function getTrainers(
  params: GetTrainersQueryParams = {},
): Promise<GetTrainersResponse> {
  // Clean up empty string values from params
  const cleanParams: Record<string, string | number> = {}

  if (params.page !== undefined) {
    cleanParams.page = params.page
  }

  if (params.limit !== undefined) {
    cleanParams.limit = params.limit
  }

  if (params.city && params.city.trim() !== '') {
    cleanParams.city = params.city.trim()
  }

  if (params.specializationId && params.specializationId.trim() !== '') {
    cleanParams.specializationId = params.specializationId.trim()
  }

  const response = await api.get<GetTrainersResponse>('/trainers', {
    params: cleanParams,
  })

  return response.data
}

/**
 * Fetch trainer details by ID
 */
export async function getTrainerById(id: string): Promise<TrainerProfileDto> {
  const response = await api.get<TrainerProfileDto>(`/trainers/${id}`)
  return response.data
}

/**
 * Fetch current user's trainer profile
 */
export async function getMyTrainerProfile(): Promise<TrainerProfileDto> {
  const response = await api.get<TrainerProfileDto>('/trainers/me')
  return response.data
}

/**
 * Fetch available specializations for filter dropdown
 */
export async function getSpecializations(): Promise<SpecializationOption[]> {
  const response = await api.get<{ id: string; name: string }[]>('/specializations')

  // Map to SpecializationOption format
  return response.data.map((spec) => ({
    value: spec.id,
    label: spec.name,
  }))
}
