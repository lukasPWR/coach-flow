<template>
  <div class="container py-8 space-y-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold tracking-tight">Moje Rezerwacje</h1>
      <p class="text-muted-foreground">
        Zarządzaj swoimi wizytami, sprawdzaj historię i status rezerwacji.
      </p>
    </div>

    <Tabs v-model="activeTab" class="space-y-4">
      <TabsList>
        <TabsTrigger value="upcoming">Nadchodzące</TabsTrigger>
        <TabsTrigger value="pending">Oczekujące</TabsTrigger>
        <TabsTrigger value="history">Historia</TabsTrigger>
      </TabsList>

      <!-- Content is handled by BookingList with shared state -->
      <div class="mt-6">
        <BookingList
          :bookings="bookings"
          :is-loading="isLoading"
          :pagination="pagination"
          empty-message="Brak rezerwacji w tej kategorii."
          @update:page="handlePageChange"
          @cancel="openCancelDialog"
          @reschedule="handleRescheduleRequest"
        >
          <template #empty-action>
            <Button
              v-if="activeTab !== 'history'"
              variant="outline"
              class="mt-4"
              @click="$router.push({ name: 'trainers-list' })"
            >
              Znajdź trenera
            </Button>
          </template>
        </BookingList>
      </div>
    </Tabs>

    <CancelBookingDialog
      :open="showCancelDialog"
      :booking="selectedBooking"
      @update:open="showCancelDialog = $event"
      @confirm="handleCancelConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BookingList from '@/components/bookings/BookingList.vue'
import CancelBookingDialog from '@/components/bookings/modals/CancelBookingDialog.vue'
import { useMyBookings } from '@/composables/useMyBookings'
import type { BookingViewModel } from '@/types/bookings'

const { bookings, isLoading, activeTab, pagination, cancelBooking, setPage } = useMyBookings()

const showCancelDialog = ref(false)
const selectedBooking = ref<BookingViewModel | null>(null)

const openCancelDialog = (booking: BookingViewModel) => {
  selectedBooking.value = booking
  showCancelDialog.value = true
}

const handleCancelConfirm = async (booking: BookingViewModel) => {
  await cancelBooking(booking.id)
  showCancelDialog.value = false
}

const handleRescheduleRequest = () => {
  // TODO: Implement reschedule functionality
  alert('Funkcja w budowie: Zmiana terminu będzie dostępna wkrótce.')
}

const handlePageChange = (page: number) => {
  setPage(page)
}
</script>
