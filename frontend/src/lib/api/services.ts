import { api } from './client'
import type {
  Service,
  ServiceType,
  CreateServicePayload,
  UpdateServicePayload,
} from '@/types/services'

/**
 * Get all service types (dictionary)
 */
export async function getServiceTypes(): Promise<ServiceType[]> {
  const response = await api.get<ServiceType[]>('/service-types')
  return response.data
}

/**
 * Get all services for the authenticated trainer
 * Services are retrieved from the trainer's profile endpoint
 */
export async function getServices(): Promise<Service[]> {
  const response = await api.get('/trainers/me')
  const trainerProfile = response.data

  // Extract services from trainer profile
  // Note: /trainers/me returns services with 'name' field (the service type name)
  // but not serviceTypeId or full serviceType object
  const services: Service[] = (trainerProfile.services || []).map((service: any) => ({
    id: service.id,
    trainerId: trainerProfile.userId || trainerProfile.id,
    serviceTypeId: service.serviceTypeId || '', // Not provided by /trainers/me
    price: Number(service.price),
    durationMinutes: service.durationMinutes,
    createdAt: service.createdAt || new Date().toISOString(),
    updatedAt: service.updatedAt || new Date().toISOString(),
    // Store the name in serviceType object for display
    serviceType: service.name ? { id: '', name: service.name } : service.serviceType,
  }))

  return services
}

/**
 * Get a single service by ID
 */
export async function getServiceById(id: string): Promise<Service> {
  const response = await api.get<Service>(`/services/${id}`)
  return response.data
}

/**
 * Create a new service
 */
export async function createService(data: CreateServicePayload): Promise<Service> {
  const response = await api.post<Service>('/services', data)
  return response.data
}

/**
 * Update an existing service
 */
export async function updateService(id: string, data: UpdateServicePayload): Promise<Service> {
  const response = await api.patch<Service>(`/services/${id}`, data)
  return response.data
}

/**
 * Delete a service
 */
export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`)
}
