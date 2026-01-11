<template>
  <div class="space-y-4">
    <div v-if="currentIsLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-xl border bg-card text-card-foreground shadow p-6 h-[140px] animate-pulse bg-muted/10"
      />
    </div>

    <div
      v-else-if="currentBookings.length > 0"
      class="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-1"
    >
      <BookingCard
        v-for="booking in currentBookings"
        :key="booking.id"
        :booking="booking"
        @cancel="$emit('cancel', $event)"
        @reschedule="$emit('reschedule', $event)"
      />
    </div>

    <PaginationControls
      v-if="currentPagination.totalPages > 1 && currentBookings.length > 0"
      :current-page="currentPagination.currentPage"
      :total-pages="currentPagination.totalPages"
      class="mt-4"
      @next="handleNextPage"
      @prev="handlePrevPage"
    />

    <div v-else class="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div class="bg-muted/20 p-4 rounded-full">
        <CalendarX class="h-8 w-8 text-muted-foreground" />
      </div>
      <p class="text-muted-foreground max-w-[250px]">
        {{ emptyMessage }}
      </p>
      <slot name="empty-action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import { CalendarX } from "lucide-vue-next";
import BookingCard from "./BookingCard.vue";
import PaginationControls from "@/components/common/PaginationControls.vue";
import { useBookings } from "@/composables/useBookings";
import type { BookingStatus, BookingViewModel, PaginationMeta } from "@/types/bookings";

const props = defineProps<{
  // Legacy props (Smart Mode)
  statuses?: BookingStatus[];
  timeFilter?: "upcoming" | "past";
  refreshTrigger?: number;

  // Common props
  emptyMessage: string;

  // New props (Dumb Mode)
  bookings?: BookingViewModel[];
  isLoading?: boolean;
  pagination?: PaginationMeta;
}>();

const emit = defineEmits<{
  cancel: [booking: BookingViewModel];
  reschedule: [booking: BookingViewModel];
  "update:page": [page: number];
}>();

// Determine mode
const isDumbMode = computed(() => props.bookings !== undefined);

// Smart Mode Logic
const {
  bookings: fetchedBookings,
  isLoading: fetchedIsLoading,
  pagination: fetchedPagination,
  filters,
  fetchBookings,
  nextPage,
  prevPage,
} = useBookings({
  role: "client",
  initialStatus: props.statuses,
  initialTimeFilter: props.timeFilter,
});

// Computed values based on mode
const currentBookings = computed(() =>
  isDumbMode.value ? props.bookings! : fetchedBookings.value
);
const currentIsLoading = computed(() =>
  isDumbMode.value ? props.isLoading : fetchedIsLoading.value
);
const currentPagination = computed(() => {
  if (isDumbMode.value) {
    return (
      props.pagination || {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 0,
        currentPage: 1,
      }
    );
  }
  return fetchedPagination.value;
});

// Event Handlers
const handleNextPage = () => {
  if (isDumbMode.value) {
    if (currentPagination.value.currentPage < currentPagination.value.totalPages) {
      emit("update:page", currentPagination.value.currentPage + 1);
    }
  } else {
    nextPage();
  }
};

const handlePrevPage = () => {
  if (isDumbMode.value) {
    if (currentPagination.value.currentPage > 1) {
      emit("update:page", currentPagination.value.currentPage - 1);
    }
  } else {
    prevPage();
  }
};

// Watchers for Smart Mode
watch(
  () => props.statuses,
  (newStatuses) => {
    if (isDumbMode.value) return;
    filters.status = newStatuses || [];
    filters.page = 1;
    fetchBookings();
  }
);

watch(
  () => props.timeFilter,
  (newVal) => {
    if (isDumbMode.value) return;
    filters.timeFilter = newVal;
    filters.page = 1;
    fetchBookings();
  }
);

watch(
  () => props.refreshTrigger,
  () => {
    if (isDumbMode.value) return;
    fetchBookings();
  }
);

onMounted(() => {
  if (!isDumbMode.value) {
    fetchBookings();
  }
});

defineExpose({
  refresh: fetchBookings,
});
</script>
