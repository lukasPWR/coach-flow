import { ref, reactive, computed, watch } from 'vue'
import { getTrainers, getSpecializations } from '@/lib/api/trainers'
import type {
  TrainerSummary,
  TrainerFiltersState,
  TrainersPaginationState,
  SpecializationOption,
} from '@/types/trainer'
import { useDebounceFn } from '@vueuse/core'

export function useTrainers() {
  // State
  const trainers = ref<TrainerSummary[]>([])
  const availableSpecializations = ref<SpecializationOption[]>([])
  const isLoading = ref(false)
  const isFetchingMore = ref(false)
  const error = ref<string | null>(null)

  const filters = reactive<TrainerFiltersState>({
    city: '',
    specializationId: null,
  })

  const pagination = ref<TrainersPaginationState>({
    currentPage: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  })

  // Computed
  const hasMore = computed(() => pagination.value.hasMore)
  const isEmpty = computed(() => !isLoading.value && trainers.value.length === 0)

  /**
   * Fetch trainers from API
   * @param reset - If true, clears existing list and resets to page 1
   */
  async function fetchTrainers(reset = false): Promise<void> {
    try {
      // Set appropriate loading state
      if (reset) {
        isLoading.value = true
        trainers.value = []
        pagination.value.currentPage = 1
      } else {
        isFetchingMore.value = true
      }

      error.value = null

      const response = await getTrainers({
        page: pagination.value.currentPage,
        limit: pagination.value.limit,
        city: filters.city || undefined,
        specializationId: filters.specializationId || undefined,
      })

      // Update trainers list
      if (reset) {
        trainers.value = response.data
      } else {
        trainers.value.push(...response.data)
      }

      // Update pagination
      pagination.value.total = response.meta.total
      pagination.value.currentPage = response.meta.page
      pagination.value.hasMore = trainers.value.length < response.meta.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania trenerów'
      console.error('Error fetching trainers:', err)
    } finally {
      isLoading.value = false
      isFetchingMore.value = false
    }
  }

  /**
   * Load more trainers (infinite scroll)
   */
  async function loadMore(): Promise<void> {
    if (isFetchingMore.value || isLoading.value || !hasMore.value) {
      return
    }

    pagination.value.currentPage += 1
    await fetchTrainers(false)
  }

  /**
   * Update filters and refetch trainers
   */
  function updateFilters(newFilters: Partial<TrainerFiltersState>): void {
    Object.assign(filters, newFilters)
    debouncedFetch()
  }

  /**
   * Clear all filters
   */
  function clearFilters(): void {
    filters.city = ''
    filters.specializationId = null
    fetchTrainers(true)
  }

  /**
   * Retry fetching after error
   */
  function retry(): void {
    fetchTrainers(true)
  }

  /**
   * Fetch available specializations for filter
   */
  async function fetchSpecializations(): Promise<void> {
    try {
      availableSpecializations.value = await getSpecializations()
    } catch (err) {
      console.error('Error fetching specializations:', err)
    }
  }

  // Debounced fetch for city filter (500ms delay)
  const debouncedFetch = useDebounceFn(() => {
    fetchTrainers(true)
  }, 500)

  // Watch city filter for debounced search
  watch(
    () => filters.city,
    () => {
      debouncedFetch()
    },
  )

  // Watch specializationId for immediate search
  watch(
    () => filters.specializationId,
    () => {
      fetchTrainers(true)
    },
  )

  return {
    // State
    trainers,
    availableSpecializations,
    isLoading,
    isFetchingMore,
    error,
    filters,
    pagination,

    // Computed
    hasMore,
    isEmpty,

    // Actions
    fetchTrainers,
    loadMore,
    updateFilters,
    clearFilters,
    retry,
    fetchSpecializations,
  }
}
