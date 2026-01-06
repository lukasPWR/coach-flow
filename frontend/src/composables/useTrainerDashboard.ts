import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bookingsApi } from '@/lib/api/bookings'
import { useAuthStore } from '@/stores/auth'
import type { BookingDto } from '@/types/bookings'
import type { PendingBookingVM, DailySessionVM } from '@/types/dashboard'

/**
 * Composable zarządzający stanem i logiką Trainer Dashboard
 */
export function useTrainerDashboard() {
  const authStore = useAuthStore()

  // State
  const pendingBookings = ref<PendingBookingVM[]>([])
  const todaysSessions = ref<DailySessionVM[]>([])
  const isLoading = ref(false)
  const isLoadingPending = ref(false)
  const isLoadingSchedule = ref(false)
  const error = ref<string | null>(null)
  const actionLoadingIds = ref<Set<string>>(new Set())

  // Timer do odświeżania liczników czasu
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // Computed
  const trainerName = computed(() => authStore.user?.name ?? 'Trenerze')

  const hasPendingBookings = computed(() => pendingBookings.value.length > 0)
  const hasTodaysSessions = computed(() => todaysSessions.value.length > 0)

  /**
   * Oblicza czas pozostały do wygaśnięcia (24h od utworzenia)
   */
  function calculateExpiration(createdAt: string): {
    expiresAt: string
    isUrgent: boolean
    isExpired: boolean
    remainingTime: string
  } {
    const created = new Date(createdAt)
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000) // +24h
    const now = new Date()
    const remainingMs = expiresAt.getTime() - now.getTime()

    if (remainingMs <= 0) {
      return {
        expiresAt: expiresAt.toISOString(),
        isUrgent: true,
        isExpired: true,
        remainingTime: 'Wygasło',
      }
    }

    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

    let remainingTime: string
    if (remainingHours >= 1) {
      remainingTime = `${remainingHours}h ${remainingMinutes}m`
    } else {
      remainingTime = `${remainingMinutes}m`
    }

    return {
      expiresAt: expiresAt.toISOString(),
      isUrgent: remainingMs < 2 * 60 * 60 * 1000, // < 2h
      isExpired: false,
      remainingTime,
    }
  }

  /**
   * Formatuje datę do formatu polskiego
   */
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  /**
   * Formatuje zakres godzin
   */
  function formatTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const formatTime = (d: Date) =>
      d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  /**
   * Sprawdza czy data jest dzisiaj
   */
  function isToday(dateStr: string): boolean {
    const date = new Date(dateStr)
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  /**
   * Mapuje BookingDto na PendingBookingVM
   */
  function mapToPendingVM(booking: BookingDto): PendingBookingVM {
    const expiration = calculateExpiration(booking.createdAt)
    return {
      id: booking.id,
      clientName: (booking as any).client?.name ?? 'Klient',
      serviceName: booking.service.name,
      startTime: booking.startTime,
      formattedDate: formatDate(booking.startTime),
      formattedTime: formatTimeRange(booking.startTime, booking.endTime),
      createdAt: booking.createdAt,
      ...expiration,
    }
  }

  /**
   * Mapuje BookingDto na DailySessionVM
   */
  function mapToDailySessionVM(booking: BookingDto): DailySessionVM {
    return {
      id: booking.id,
      clientName: (booking as any).client?.name ?? 'Klient',
      serviceName: booking.service.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      timeRange: formatTimeRange(booking.startTime, booking.endTime),
      status: 'ACCEPTED',
    }
  }

  /**
   * Odświeża liczniki czasu dla oczekujących rezerwacji
   */
  function refreshExpirationTimers() {
    pendingBookings.value = pendingBookings.value.map((booking) => {
      const expiration = calculateExpiration(booking.createdAt)
      return {
        ...booking,
        ...expiration,
      }
    })
  }

  /**
   * Pobiera oczekujące rezerwacje
   */
  async function fetchPendingBookings() {
    isLoadingPending.value = true
    try {
      const response = await bookingsApi.getPendingBookings(10)
      const mapped = response.data.map(mapToPendingVM)
      // Sortuj od najstarszych (najpilniejszych)
      pendingBookings.value = mapped.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    } catch (err: any) {
      console.error('Błąd pobierania oczekujących rezerwacji:', err)
      error.value = 'Nie udało się pobrać oczekujących rezerwacji'
    } finally {
      isLoadingPending.value = false
    }
  }

  /**
   * Pobiera dzisiejsze sesje
   */
  async function fetchTodaysSessions() {
    isLoadingSchedule.value = true
    try {
      const response = await bookingsApi.getAcceptedBookings(50)
      // Filtruj tylko dzisiejsze sesje
      const todayBookings = response.data.filter((b) => isToday(b.startTime))
      const mapped = todayBookings.map(mapToDailySessionVM)
      // Sortuj chronologicznie
      todaysSessions.value = mapped.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    } catch (err: any) {
      console.error('Błąd pobierania dzisiejszych sesji:', err)
      error.value = 'Nie udało się pobrać harmonogramu'
    } finally {
      isLoadingSchedule.value = false
    }
  }

  /**
   * Pobiera wszystkie dane dashboardu
   */
  async function fetchDashboardData() {
    isLoading.value = true
    error.value = null
    try {
      await Promise.all([fetchPendingBookings(), fetchTodaysSessions()])
    } catch (err: any) {
      console.error('Błąd pobierania danych dashboardu:', err)
      error.value = 'Wystąpił błąd podczas ładowania danych'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Akceptuje rezerwację
   */
  async function approveBooking(id: string) {
    actionLoadingIds.value.add(id)
    try {
      const updatedBooking = await bookingsApi.approveBooking(id)

      // Usuń z listy oczekujących
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== id)

      // Jeśli termin jest dzisiaj, dodaj do agendy
      if (isToday(updatedBooking.startTime)) {
        const sessionVM = mapToDailySessionVM(updatedBooking)
        todaysSessions.value = [...todaysSessions.value, sessionVM].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      }

      return { success: true, message: 'Rezerwacja zaakceptowana' }
    } catch (err: any) {
      console.error('Błąd akceptacji rezerwacji:', err)
      const status = err.response?.status
      if (status === 404) {
        // Rezerwacja nie istnieje - odśwież listę
        await fetchPendingBookings()
        return { success: false, message: 'Ta rezerwacja nie jest już dostępna' }
      }
      if (status === 409) {
        await fetchPendingBookings()
        return { success: false, message: 'Konflikt - termin jest już zajęty' }
      }
      return { success: false, message: 'Nie udało się zaakceptować rezerwacji' }
    } finally {
      actionLoadingIds.value.delete(id)
    }
  }

  /**
   * Odrzuca rezerwację
   */
  async function rejectBooking(id: string) {
    actionLoadingIds.value.add(id)
    try {
      await bookingsApi.rejectBooking(id)

      // Usuń z listy oczekujących
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== id)

      return { success: true, message: 'Rezerwacja odrzucona' }
    } catch (err: any) {
      console.error('Błąd odrzucenia rezerwacji:', err)
      const status = err.response?.status
      if (status === 404) {
        await fetchPendingBookings()
        return { success: false, message: 'Ta rezerwacja nie jest już dostępna' }
      }
      return { success: false, message: 'Nie udało się odrzucić rezerwacji' }
    } finally {
      actionLoadingIds.value.delete(id)
    }
  }

  /**
   * Sprawdza czy akcja jest w trakcie dla danego ID
   */
  function isActionLoading(id: string): boolean {
    return actionLoadingIds.value.has(id)
  }

  /**
   * Ponownie ładuje dane
   */
  async function retry() {
    await fetchDashboardData()
  }

  // Lifecycle
  onMounted(() => {
    fetchDashboardData()
    // Odświeżaj liczniki co minutę
    timerInterval = setInterval(refreshExpirationTimers, 60 * 1000)
  })

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })

  return {
    // State
    pendingBookings,
    todaysSessions,
    isLoading,
    isLoadingPending,
    isLoadingSchedule,
    error,
    trainerName,

    // Computed
    hasPendingBookings,
    hasTodaysSessions,

    // Actions
    fetchDashboardData,
    fetchPendingBookings,
    fetchTodaysSessions,
    approveBooking,
    rejectBooking,
    isActionLoading,
    retry,
  }
}
