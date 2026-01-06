<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core'
import { useTrainerCalendar } from '@/composables/useTrainerCalendar'
import FullCalendarWrapper from '@/components/calendar/FullCalendarWrapper.vue'
import UnavailabilityModal from '@/components/calendar/UnavailabilityModal.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CalendarDays, AlertCircle, RefreshCw } from 'lucide-vue-next'
import type {
  CalendarEventType,
  UnavailabilityFormData,
  UnavailabilityModalMode,
  CalendarDateRange,
} from '@/types/calendar'

// Composable
const {
  events,
  isLoading,
  error,
  fetchEvents,
  addUnavailability,
  updateUnavailability,
  removeUnavailability,
  clearError,
} = useTrainerCalendar()

// Stan modala
const isModalOpen = ref(false)
const modalMode = ref<UnavailabilityModalMode>('CREATE')
const modalInitialData = ref<UnavailabilityFormData | null>(null)
const isModalLoading = ref(false)

// Aktualny zakres dat kalendarza
const currentDateRange = ref<CalendarDateRange | null>(null)

// Flaga do śledzenia czy już pobrano dane dla aktualnego zakresu
const lastFetchedRange = ref<string | null>(null)

// Toast / Komunikaty (prosty mechanizm)
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

function showToast(type: 'success' | 'error', text: string) {
  toastMessage.value = { type, text }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Konwersja daty do formatu datetime-local
function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

// Konwersja z datetime-local do ISO
function fromDateTimeLocal(dateTimeLocal: string): string {
  return new Date(dateTimeLocal).toISOString()
}

// Obsługa zmiany zakresu dat w kalendarzu
function handleDatesSet(range: { start: Date; end: Date }) {
  // Generuj klucz zakresu do porównania
  const rangeKey = `${range.start.toISOString()}-${range.end.toISOString()}`

  // Sprawdź czy zakres się zmienił - zapobiega nieskończonej pętli
  if (lastFetchedRange.value === rangeKey) {
    return
  }

  currentDateRange.value = range
  lastFetchedRange.value = rangeKey
  fetchEvents(range)
}

// Obsługa zaznaczenia zakresu w kalendarzu (tworzenie niedostępności)
function handleDateSelect(info: DateSelectArg) {
  modalMode.value = 'CREATE'
  modalInitialData.value = {
    startTime: toDateTimeLocal(info.start),
    endTime: toDateTimeLocal(info.end),
  }
  isModalOpen.value = true
}

// Obsługa kliknięcia w wydarzenie
function handleEventClick(info: EventClickArg) {
  const eventType = info.event.extendedProps.type as CalendarEventType

  if (eventType === 'BOOKING') {
    // Rezerwacje nie są edytowalne - pokaż informację
    showToast('error', 'Rezerwacje można edytować tylko w widoku rezerwacji')
    return
  }

  if (eventType === 'UNAVAILABILITY') {
    // Otwórz modal edycji
    modalMode.value = 'EDIT'
    modalInitialData.value = {
      id: info.event.extendedProps.originalId,
      startTime: toDateTimeLocal(info.event.start!),
      endTime: toDateTimeLocal(info.event.end!),
    }
    isModalOpen.value = true
  }
}

// Obsługa przeciągania/zmiany rozmiaru wydarzenia (D&D)
async function handleEventChange(info: EventChangeArg) {
  const eventType = info.event.extendedProps.type as CalendarEventType

  // Tylko niedostępności mogą być przesuwane
  if (eventType !== 'UNAVAILABILITY') {
    info.revert()
    return
  }

  const originalId = info.event.extendedProps.originalId
  const result = await updateUnavailability(originalId, {
    startTime: info.event.start!.toISOString(),
    endTime: info.event.end!.toISOString(),
  })

  if (!result.success) {
    info.revert()
    showToast('error', result.message)
  } else {
    showToast('success', result.message)
  }
}

// Obsługa zapisu z modala
async function handleModalSave(data: UnavailabilityFormData) {
  isModalLoading.value = true

  try {
    if (modalMode.value === 'CREATE') {
      const result = await addUnavailability({
        startTime: fromDateTimeLocal(data.startTime),
        endTime: fromDateTimeLocal(data.endTime),
      })

      if (result.success) {
        showToast('success', result.message)
        isModalOpen.value = false
      } else {
        showToast('error', result.message)
      }
    } else {
      // Tryb edycji
      const result = await updateUnavailability(data.id!, {
        startTime: fromDateTimeLocal(data.startTime),
        endTime: fromDateTimeLocal(data.endTime),
      })

      if (result.success) {
        showToast('success', result.message)
        isModalOpen.value = false
      } else {
        showToast('error', result.message)
      }
    }
  } finally {
    isModalLoading.value = false
  }
}

// Obsługa usuwania z modala
async function handleModalDelete(id: string) {
  isModalLoading.value = true

  try {
    const result = await removeUnavailability(id)

    if (result.success) {
      showToast('success', result.message)
      isModalOpen.value = false
    } else {
      showToast('error', result.message)
    }
  } finally {
    isModalLoading.value = false
  }
}

// Obsługa zamknięcia modala
function handleModalClose() {
  isModalOpen.value = false
  modalInitialData.value = null
}

// Obsługa ponownego ładowania
async function handleRetry() {
  clearError()
  if (currentDateRange.value) {
    await fetchEvents(currentDateRange.value)
  }
}

// Inicjalizacja - kalendarz sam wywoła datesSet przy pierwszym renderze
onMounted(() => {
  // Nic dodatkowego - fetchEvents zostanie wywołane przez datesSet
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- Nagłówek -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <CalendarDays class="h-8 w-8 text-primary" />
        <h1 class="text-2xl font-bold text-foreground">Kalendarz</h1>
      </div>
      <p class="text-muted-foreground">
        Zarządzaj swoim harmonogramem. Kliknij i przeciągnij, aby dodać okres niedostępności.
      </p>
    </div>

    <!-- Toast / Komunikat -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <Alert
        v-if="toastMessage"
        :variant="toastMessage.type === 'error' ? 'destructive' : 'default'"
        class="mb-4"
      >
        <AlertCircle v-if="toastMessage.type === 'error'" class="h-4 w-4" />
        <AlertTitle>{{ toastMessage.type === 'error' ? 'Błąd' : 'Sukces' }}</AlertTitle>
        <AlertDescription>{{ toastMessage.text }}</AlertDescription>
      </Alert>
    </Transition>

    <!-- Błąd ładowania -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Nie udało się załadować kalendarza</AlertTitle>
      <AlertDescription class="flex items-center justify-between">
        <span>{{ error }}</span>
        <Button variant="outline" size="sm" @click="handleRetry">
          <RefreshCw class="h-4 w-4 mr-2" />
          Spróbuj ponownie
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Legenda -->
    <div class="flex flex-wrap gap-4 mb-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-blue-500" />
        <span class="text-muted-foreground">Rezerwacje (tylko podgląd)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-gray-500" />
        <span class="text-muted-foreground">Niedostępność (edytowalna)</span>
      </div>
    </div>

    <!-- Kalendarz -->
    <div class="bg-card rounded-lg border shadow-sm p-4">
      <FullCalendarWrapper
        :events="events"
        :is-loading="isLoading"
        @select="handleDateSelect"
        @event-click="handleEventClick"
        @event-change="handleEventChange"
        @dates-set="handleDatesSet"
      />
    </div>

    <!-- Modal niedostępności -->
    <UnavailabilityModal
      :is-open="isModalOpen"
      :initial-data="modalInitialData"
      :mode="modalMode"
      :is-loading="isModalLoading"
      @close="handleModalClose"
      @save="handleModalSave"
      @delete="handleModalDelete"
    />
  </div>
</template>
