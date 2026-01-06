import { ref, computed } from 'vue'
import type { ServiceType } from '@/types/services'
import * as servicesApi from '@/lib/api/services'

const serviceTypes = ref<ServiceType[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useServiceTypes() {
  /**
   * Computed map of service type ID to name for easy lookup
   */
  const serviceTypesMap = computed<Record<string, string>>(() => {
    return serviceTypes.value.reduce(
      (acc, type) => {
        acc[type.id] = type.name
        return acc
      },
      {} as Record<string, string>,
    )
  })

  /**
   * Fetch all service types from API
   */
  const fetchServiceTypes = async (force = false) => {
    // If already loaded and not forcing refresh, skip
    if (serviceTypes.value.length > 0 && !force) {
      return
    }

    try {
      isLoading.value = true
      error.value = null
      serviceTypes.value = await servicesApi.getServiceTypes()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch service types'
      console.error('Failed to fetch service types:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    serviceTypes,
    serviceTypesMap,
    isLoading,
    error,
    fetchServiceTypes,
  }
}

