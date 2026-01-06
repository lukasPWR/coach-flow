import { ref } from 'vue'
import type { Service, ServiceFormValues } from '@/types/services'
import * as servicesApi from '@/lib/api/services'
import { useAuthStore } from '@/stores/auth'

export function useServices() {
  const services = ref<Service[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()

  /**
   * Fetch all services for the authenticated trainer
   */
  const fetchServices = async () => {
    try {
      isLoading.value = true
      error.value = null
      services.value = await servicesApi.getServices()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch services'
      console.error('Failed to fetch services:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new service
   */
  const createService = async (data: ServiceFormValues): Promise<Service> => {
    try {
      isLoading.value = true
      error.value = null

      // Get trainerId - backend requires it in the payload
      // even though the user is authenticated
      let trainerId = authStore.user?.id

      if (!trainerId) {
        throw new Error('User ID not found. Please log in again.')
      }

      const payload = {
        trainerId,
        serviceTypeId: data.serviceTypeId,
        price: data.price,
        durationMinutes: data.durationMinutes,
      }

      const newService = await servicesApi.createService(payload)

      // Refresh the services list from the API to get accurate data
      await fetchServices()

      return newService
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create service'
      console.error('Failed to create service:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing service
   */
  const updateService = async (id: string, data: Partial<ServiceFormValues>): Promise<Service> => {
    try {
      isLoading.value = true
      error.value = null

      const payload: { price?: number; durationMinutes?: number } = {}
      if (data.price !== undefined) payload.price = data.price
      if (data.durationMinutes !== undefined) payload.durationMinutes = data.durationMinutes

      const updatedService = await servicesApi.updateService(id, payload)

      // Refresh the services list from the API to get accurate data
      await fetchServices()

      return updatedService
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update service'
      console.error('Failed to update service:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a service
   */
  const deleteService = async (id: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      await servicesApi.deleteService(id)

      // Refresh the services list from the API to get accurate data
      await fetchServices()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete service'
      console.error('Failed to delete service:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    services,
    isLoading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
  }
}
