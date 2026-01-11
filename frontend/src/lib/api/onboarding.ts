import { api } from './client'
import type {
  CreateTrainerProfileDto,
  CreateServiceDto,
  CreateUnavailabilityDto,
  ServiceResponseDto,
  ServiceType,
  Specialization,
  UnavailabilityResponseDto,
} from '@/types/onboarding'

export async function createTrainerProfile(data: CreateTrainerProfileDto) {
  const response = await api.post('/trainers', data)
  return response.data
}

export async function getSpecializations() {
  const response = await api.get<Specialization[]>('/specializations')
  return response.data
}

export async function getServiceTypes() {
  const response = await api.get<ServiceType[]>('/service-types')
  return response.data
}

export async function getServices() {
  const response = await api.get<ServiceResponseDto[]>('/services')
  return response.data
}

export async function createService(data: CreateServiceDto) {
  const response = await api.post<ServiceResponseDto>('/services', data)
  return response.data
}

export async function deleteService(id: string) {
  const response = await api.delete(`/services/${id}`)
  return response.data
}

export async function createUnavailability(data: CreateUnavailabilityDto) {
  const response = await api.post<UnavailabilityResponseDto>('/unavailabilities', data)
  return response.data
}

export async function getUnavailabilities() {
  const response = await api.get<UnavailabilityResponseDto[]>('/unavailabilities')
  return response.data
}

export async function deleteUnavailability(id: string) {
  const response = await api.delete(`/unavailabilities/${id}`)
  return response.data
}

export async function getMyTrainerProfile() {
  try {
    const response = await api.get('/trainers/me')
    return response.data
  } catch {
    // If 404, it means profile doesn't exist, which is expected for new onboarding
    return null
  }
}
