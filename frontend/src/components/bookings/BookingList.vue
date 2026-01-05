<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-xl border bg-card text-card-foreground shadow p-6 h-[140px] animate-pulse bg-muted/10"
      ></div>
    </div>

    <div v-else-if="bookings.length > 0" class="space-y-4">
      <BookingCard
        v-for="booking in bookings"
        :key="booking.id"
        :booking="booking"
        @cancel="$emit('cancel', $event)"
        @reschedule="$emit('reschedule', $event)"
      />

      <PaginationControls
        v-if="pagination.totalPages > 1"
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        @next="nextPage"
        @prev="prevPage"
      />
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div class="bg-muted/20 p-4 rounded-full">
        <CalendarX class="h-8 w-8 text-muted-foreground" />
      </div>
      <p class="text-muted-foreground max-w-[250px]">{{ emptyMessage }}</p>
      <slot name="empty-action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { CalendarX } from 'lucide-vue-next'
import BookingCard from './BookingCard.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import { useBookings } from '@/composables/useBookings'
import type { BookingStatus, BookingViewModel } from '@/types/bookings'

const props = defineProps<{
  statuses: BookingStatus[]
  timeFilter?: 'upcoming' | 'past'
  emptyMessage: string
  refreshTrigger?: number
}>()

const emit = defineEmits<{
  (e: 'cancel', booking: BookingViewModel): void
  (e: 'reschedule', booking: BookingViewModel): void
}>()

const { bookings, isLoading, pagination, filters, fetchBookings, nextPage, prevPage } = useBookings(
  {
    role: 'client',
    initialStatus: props.statuses,
    initialTimeFilter: props.timeFilter,
  },
)

watch(
  () => props.statuses,
  (newStatuses) => {
    filters.status = newStatuses
    filters.page = 1
    fetchBookings()
  },
)

watch(
  () => props.timeFilter,
  (newVal) => {
    filters.timeFilter = newVal
    filters.page = 1
    fetchBookings()
  },
)

watch(
  () => props.refreshTrigger,
  () => {
    fetchBookings()
  },
)

onMounted(() => {
  fetchBookings()
})

defineExpose({
  refresh: fetchBookings,
})
</script>
