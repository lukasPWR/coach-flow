import { ref, computed, watch } from 'vue'
import { useBookings } from './useBookings'
import { bookingsApi } from '@/lib/api/bookings'
import { BookingStatus, type BookingTab } from '@/types/bookings'

export function useMyBookings() {
  const activeTab = ref<BookingTab>('upcoming')

  const tabParams = computed(() => {
    switch (activeTab.value) {
      case 'upcoming':
        return {
          status: [BookingStatus.ACCEPTED],
          timeFilter: 'upcoming' as const,
        }
      case 'pending':
        return {
          status: [BookingStatus.PENDING],
          timeFilter: undefined,
        }
      case 'history':
        return {
          status: [BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
          timeFilter: 'past' as const,
        }
      default:
        return {
          status: [BookingStatus.ACCEPTED],
          timeFilter: 'upcoming' as const,
        }
    }
  })

  const {
    bookings,
    isLoading,
    pagination,
    filters,
    fetchBookings: baseFetch,
    nextPage,
    prevPage,
  } = useBookings({
    role: 'client',
    initialStatus: tabParams.value.status,
    initialTimeFilter: tabParams.value.timeFilter,
  })

  const fetch = async () => {
    try {
      await baseFetch()
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      // We could add a toast here if we want global error feedback for fetching
    }
  }

  watch(activeTab, () => {
    const params = tabParams.value
    filters.status = params.status
    filters.timeFilter = params.timeFilter
    filters.page = 1
    fetch()
  })

  const cancelBooking = async (id: string) => {
    try {
      await bookingsApi.cancelBooking(id)
      console.log('Rezerwacja anulowana')
      fetch()
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      throw error // Re-throw to let component handle specific UI feedback (e.g. closing dialog)
    }
  }

  const setPage = (page: number) => {
    filters.page = page
    fetch()
  }

  return {
    bookings,
    isLoading,
    activeTab,
    pagination,
    fetchBookings: fetch,
    cancelBooking,
    nextPage,
    prevPage,
    setPage,
  }
}
