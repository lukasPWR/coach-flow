<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ref, onMounted, computed } from 'vue'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import { api } from '@/lib/api/client'

interface Props {
  trainerId: string
}

const props = defineProps<Props>()

interface Unavailability {
  id: string
  startTime: string
  endTime: string
}

const value = ref<CalendarDate>(today(getLocalTimeZone()))
const unavailabilities = ref<Unavailability[]>([])
const isLoadingUnavailabilities = ref(false)

// Load unavailabilities for this trainer
onMounted(async () => {
  await loadUnavailabilities()
})

const loadUnavailabilities = async () => {
  try {
    isLoadingUnavailabilities.value = true
    // Fetch unavailabilities for the specific trainer (public endpoint or filtered)
    // For now, we'll use the general endpoint which returns all for authenticated user
    // We need a public endpoint to get unavailabilities for a specific trainer
    const response = await api.get<Unavailability[]>(
      `/trainers/${props.trainerId}/unavailabilities`,
    )
    unavailabilities.value = response.data
  } catch (error) {
    console.error('Failed to load unavailabilities', error)
    // If endpoint doesn't exist yet, fail silently
    unavailabilities.value = []
  } finally {
    isLoadingUnavailabilities.value = false
  }
}

// Get unavailabilities for the currently displayed month
const getUnavailabilitiesForMonth = computed(() => {
  if (!value.value) return []

  return unavailabilities.value.filter((unavail) => {
    const unavailDate = new Date(unavail.startTime)
    return (
      unavailDate.getFullYear() === value.value.year &&
      unavailDate.getMonth() + 1 === value.value.month
    )
  })
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  })
}

const formatTimeRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${e.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
}

// Placeholder for future implementation
const handleBooking = () => {
  console.log('Booking logic to be implemented for:', value.value)
}
</script>

<template>
  <Card class="sticky top-4 md:border md:shadow-sm border-0 shadow-none">
    <CardHeader>
      <CardTitle>Dostępność</CardTitle>
      <CardDescription>Wybierz termin, aby umówić się na trening</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex justify-center">
        <Calendar v-model="value as any" mode="single" class="rounded-md border" />
      </div>

      <!-- Show unavailabilities for the current month -->
      <div v-if="getUnavailabilitiesForMonth.length > 0" class="space-y-2">
        <p class="text-sm font-medium">Niedostępności w tym miesiącu:</p>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <div
            v-for="unavail in getUnavailabilitiesForMonth"
            :key="unavail.id"
            class="text-xs text-muted-foreground border-l-2 border-destructive pl-2 py-1"
          >
            <div class="font-medium">{{ formatDate(unavail.startTime) }}</div>
            <div>{{ formatTimeRange(unavail.startTime, unavail.endTime) }}</div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <div class="h-3 w-3 rounded-full bg-primary"></div>
          <span>Dostępne terminy</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <div class="h-3 w-3 rounded-full bg-destructive"></div>
          <span>Zajęte/Niedostępne</span>
        </div>
      </div>

      <Button class="w-full" @click="handleBooking"> Zarezerwuj termin </Button>
    </CardContent>
  </Card>
</template>
