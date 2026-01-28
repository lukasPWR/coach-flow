<template>
  <div class="container py-8 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <DashboardHeader :user-name="user?.name || 'Użytkowniku'" />
      <Button @click="goToTrainers"> Znajdź trenera </Button>
    </div>

    <NotificationWidget :notifications="notifications" />

    <DashboardStats :upcoming-count="upcomingCount"
:pending-count="pendingCount" />

    <ActivePlanCard :active-plan="activePlan"
:loading="trainingLoading" />

    <Tabs default-value="upcoming"
class="space-y-4">
      <TabsList>
        <TabsTrigger value="upcoming"> Nadchodzące </TabsTrigger>
        <TabsTrigger value="pending"> Oczekujące </TabsTrigger>
        <TabsTrigger value="history"> Historia </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <BookingList
          :statuses="[BookingStatus.ACCEPTED]"
          time-filter="upcoming"
          empty-message="Nie masz żadnych nadchodzących sesji."
          :refresh-trigger="refreshTrigger"
          @cancel="openCancelDialog"
          @reschedule="openRescheduleDialog"
        >
          <template #empty-action>
            <Button
variant="outline" class="mt-4" @click="goToTrainers"> Znajdź trenera </Button>
          </template>
        </BookingList>
      </TabsContent>

      <TabsContent value="pending">
        <BookingList
          :statuses="[BookingStatus.PENDING]"
          empty-message="Brak oczekujących rezerwacji."
          :refresh-trigger="refreshTrigger"
          @cancel="openCancelDialog"
          @reschedule="openRescheduleDialog"
        >
          <template #empty-action>
            <Button
variant="outline" class="mt-4" @click="goToTrainers"> Znajdź trenera </Button>
          </template>
        </BookingList>
      </TabsContent>

      <TabsContent value="history">
        <BookingList
          :statuses="[BookingStatus.ACCEPTED, BookingStatus.CANCELLED, BookingStatus.REJECTED]"
          time-filter="past"
          empty-message="Twoja historia jest pusta."
          :refresh-trigger="refreshTrigger"
          @cancel="openCancelDialog"
          @reschedule="openRescheduleDialog"
        >
          <template #empty-action>
            <Button variant="link"
class="mt-2" @click="goToTrainers">
              Umów pierwszy trening
            </Button>
          </template>
        </BookingList>
      </TabsContent>
    </Tabs>

    <CancelBookingDialog
      :open="showCancelDialog"
      :booking="selectedBooking"
      @update:open="showCancelDialog = $event"
      @confirm="handleCancelBooking"
    />

    <RescheduleBookingDialog
      :open="showRescheduleDialog"
      :booking="selectedBooking"
      @update:open="showRescheduleDialog = $event"
      @confirm="handleRescheduleBooking"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { BookingStatus, type BookingViewModel } from "@/types/bookings";
import { bookingsApi } from "@/lib/api/bookings";
import { useAuthStore } from "@/stores/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader.vue";
import DashboardStats from "@/components/dashboard/DashboardStats.vue";
import BookingList from "@/components/bookings/BookingList.vue";
import CancelBookingDialog from "@/components/bookings/modals/CancelBookingDialog.vue";
import RescheduleBookingDialog from "@/components/bookings/modals/RescheduleBookingDialog.vue";
import NotificationWidget from "@/components/dashboard/NotificationWidget.vue";
import ActivePlanCard from "@/components/training-plans/ActivePlanCard.vue";
import { useDashboardTrainingSummary } from "@/composables/useDashboardTrainingSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

// Training Summary Logic
const {
  activePlan,
  notifications,
  loading: trainingLoading,
  loadTrainingSummary,
} = useDashboardTrainingSummary();

const showCancelDialog = ref(false);
const showRescheduleDialog = ref(false);
const selectedBooking = ref<BookingViewModel | null>(null);
const refreshTrigger = ref(0);
const upcomingCount = ref(0);
const pendingCount = ref(0);

const goToTrainers = () => {
  router.push({ name: "trainers-list" });
};

const openCancelDialog = (booking: BookingViewModel) => {
  selectedBooking.value = booking;
  showCancelDialog.value = true;
};

const openRescheduleDialog = (booking: BookingViewModel) => {
  selectedBooking.value = booking;
  showRescheduleDialog.value = true;
};

const handleCancelBooking = async (booking: BookingViewModel) => {
  try {
    await bookingsApi.cancelBooking(booking.id);
    refreshTrigger.value++;
    showCancelDialog.value = false;
  } catch (error) {
    console.error(error);
  }
};

const handleRescheduleBooking = async (booking: BookingViewModel, newDate: string) => {
  try {
    await bookingsApi.rescheduleBooking(booking.id, newDate);
    refreshTrigger.value++;
    showRescheduleDialog.value = false;
  } catch (error) {
    console.error(error);
  }
};

const loadStats = async () => {
  try {
    const [upcomingResponse, pendingResponse] = await Promise.all([
      bookingsApi.getBookings({
        role: "client",
        status: [BookingStatus.ACCEPTED],
        timeFilter: "upcoming",
        page: 1,
        limit: 1,
      }),
      bookingsApi.getBookings({
        role: "client",
        status: [BookingStatus.PENDING],
        page: 1,
        limit: 1,
      }),
    ]);

    upcomingCount.value = upcomingResponse.meta.totalItems;
    pendingCount.value = pendingResponse.meta.totalItems;
  } catch (error) {
    console.error("Failed to load booking stats:", error);
  }
};

onMounted(() => {
  if (!user.value) {
    authStore.fetchProfile();
  }
  loadStats();
  loadTrainingSummary();
});

watch(refreshTrigger, () => {
  loadStats();
  loadTrainingSummary();
});
</script>
