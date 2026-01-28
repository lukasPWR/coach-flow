<template>
  <div class="container mx-auto py-8 px-4 max-w-6xl">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Rezerwacje</h1>
        <p class="text-muted-foreground mt-2">Zarządzaj rezerwacjami swoich klientów</p>
      </div>

      <!-- Tabs -->
      <Tabs
        :default-value="activeTab"
        @update:model-value="(value) => handleTabChange(String(value))"
      >
        <TabsList class="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="pending">
            Oczekujące
            <Badge v-if="pendingCount > 0"
variant="secondary" class="ml-2">
              {{ pendingCount }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming"> Nadchodzące </TabsTrigger>
          <TabsTrigger value="rejected"> Odrzucone </TabsTrigger>
          <TabsTrigger value="cancelled"> Anulowane </TabsTrigger>
        </TabsList>

        <TabsContent value="pending"
class="mt-6">
          <div v-if="isLoading"
class="space-y-4">
            <div
              v-for="i in 3"
              :key="i"
              class="rounded-xl border text-card-foreground shadow p-6 h-[180px] animate-pulse bg-muted/10"
            />
          </div>

          <div v-else-if="error"
class="text-center py-12">
            <div class="bg-destructive/10 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
              <p class="text-lg font-semibold mb-2">Wystąpił błąd</p>
              <p class="text-sm text-muted-foreground mb-4">
                {{ error }}
              </p>
              <Button variant="outline"
@click="fetchBookings">
                <RefreshCw class="h-4 w-4 mr-2" />
                Spróbuj ponownie
              </Button>
            </div>
          </div>

          <div v-else-if="bookings.length === 0"
class="text-center py-12">
            <div class="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
              <CalendarX class="h-12 w-12 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold mb-2">Brak oczekujących rezerwacji</p>
            <p class="text-sm text-muted-foreground">Nowe rezerwacje pojawią się tutaj</p>
          </div>

          <div v-else
class="space-y-4">
            <TrainerBookingCard
              v-for="booking in bookings"
              :key="booking.id"
              :booking="booking"
              :is-processing="processingBookingId === booking.id"
              @approve="handleApprove"
              @reject="handleReject"
              @cancel="handleCancelClick"
            />

            <PaginationControls
              v-if="pagination.totalPages > 1"
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              class="mt-6"
              @next="nextPage"
              @prev="prevPage"
            />
          </div>
        </TabsContent>

        <TabsContent value="upcoming"
class="mt-6">
          <div v-if="isLoading"
class="space-y-4">
            <div
              v-for="i in 3"
              :key="i"
              class="rounded-xl border text-card-foreground shadow p-6 h-[180px] animate-pulse bg-muted/10"
            />
          </div>

          <div v-else-if="error"
class="text-center py-12">
            <div class="bg-destructive/10 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
              <p class="text-lg font-semibold mb-2">Wystąpił błąd</p>
              <p class="text-sm text-muted-foreground mb-4">
                {{ error }}
              </p>
              <Button variant="outline"
@click="fetchBookings">
                <RefreshCw class="h-4 w-4 mr-2" />
                Spróbuj ponownie
              </Button>
            </div>
          </div>

          <div v-else-if="bookings.length === 0"
class="text-center py-12">
            <div class="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
              <CalendarCheck class="h-12 w-12 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold mb-2">Brak nadchodzących rezerwacji</p>
            <p class="text-sm text-muted-foreground">Zaakceptowane rezerwacje pojawią się tutaj</p>
          </div>

          <div v-else
class="space-y-4">
            <TrainerBookingCard
              v-for="booking in bookings"
              :key="booking.id"
              :booking="booking"
              :is-processing="processingBookingId === booking.id"
              @cancel="handleCancelClick"
            />

            <PaginationControls
              v-if="pagination.totalPages > 1"
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              class="mt-6"
              @next="nextPage"
              @prev="prevPage"
            />
          </div>
        </TabsContent>

        <TabsContent value="rejected"
class="mt-6">
          <div v-if="isLoading"
class="space-y-4">
            <div
              v-for="i in 3"
              :key="i"
              class="rounded-xl border text-card-foreground shadow p-6 h-[180px] animate-pulse bg-muted/10"
            />
          </div>

          <div v-else-if="error"
class="text-center py-12">
            <div class="bg-destructive/10 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
              <p class="text-lg font-semibold mb-2">Wystąpił błąd</p>
              <p class="text-sm text-muted-foreground mb-4">
                {{ error }}
              </p>
              <Button variant="outline"
@click="fetchBookings">
                <RefreshCw class="h-4 w-4 mr-2" />
                Spróbuj ponownie
              </Button>
            </div>
          </div>

          <div v-else-if="bookings.length === 0"
class="text-center py-12">
            <div class="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
              <XCircle class="h-12 w-12 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold mb-2">Brak odrzuconych rezerwacji</p>
            <p class="text-sm text-muted-foreground">Odrzucone rezerwacje pojawią się tutaj</p>
          </div>

          <div v-else
class="space-y-4">
            <TrainerBookingCard v-for="booking in bookings"
:key="booking.id" :booking="booking" />

            <PaginationControls
              v-if="pagination.totalPages > 1"
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              class="mt-6"
              @next="nextPage"
              @prev="prevPage"
            />
          </div>
        </TabsContent>

        <TabsContent value="cancelled"
class="mt-6">
          <div v-if="isLoading"
class="space-y-4">
            <div
              v-for="i in 3"
              :key="i"
              class="rounded-xl border text-card-foreground shadow p-6 h-[180px] animate-pulse bg-muted/10"
            />
          </div>

          <div v-else-if="error"
class="text-center py-12">
            <div class="bg-destructive/10 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
              <p class="text-lg font-semibold mb-2">Wystąpił błąd</p>
              <p class="text-sm text-muted-foreground mb-4">
                {{ error }}
              </p>
              <Button variant="outline"
@click="fetchBookings">
                <RefreshCw class="h-4 w-4 mr-2" />
                Spróbuj ponownie
              </Button>
            </div>
          </div>

          <div v-else-if="bookings.length === 0"
class="text-center py-12">
            <div class="bg-muted/20 p-4 rounded-full w-fit mx-auto mb-4">
              <Ban class="h-12 w-12 text-muted-foreground" />
            </div>
            <p class="text-lg font-semibold mb-2">Brak anulowanych rezerwacji</p>
            <p class="text-sm text-muted-foreground">Anulowane rezerwacje pojawią się tutaj</p>
          </div>

          <div v-else
class="space-y-4">
            <TrainerBookingCard v-for="booking in bookings"
:key="booking.id" :booking="booking" />

            <PaginationControls
              v-if="pagination.totalPages > 1"
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              class="mt-6"
              @next="nextPage"
              @prev="prevPage"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Action Dialog -->
    <BookingActionDialog
      v-model:open="dialogOpen"
      :booking="selectedBooking"
      :action-type="dialogActionType"
      :is-processing="actionProcessing"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />

    <!-- Notification Toast -->
    <Transition name="toast">
      <div v-if="notification"
class="fixed bottom-4 right-4 z-50 w-full max-w-sm">
        <Alert :variant="notification.type === 'error' ? 'destructive' : 'default'">
          <CheckCircle v-if="notification.type === 'success'"
class="h-4 w-4" />
          <AlertCircle v-if="notification.type === 'error'"
class="h-4 w-4" />
          <AlertTitle>{{ notification.type === "error" ? "Błąd" : "Sukces" }}</AlertTitle>
          <AlertDescription>{{ notification.message }}</AlertDescription>
        </Alert>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  AlertCircle,
  CalendarX,
  CalendarCheck,
  XCircle,
  Ban,
  RefreshCw,
  CheckCircle,
} from "lucide-vue-next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaginationControls from "@/components/common/PaginationControls.vue";
import { TrainerBookingCard, BookingActionDialog } from "@/components/bookings";
import { useBookings } from "@/composables/useBookings";
import { useBookingActions } from "@/composables/useBookingActions";
import { BookingStatus, type BookingViewModel } from "@/types/bookings";

type TabValue = "pending" | "upcoming" | "rejected" | "cancelled";

const router = useRouter();
const route = useRoute();

// State
const activeTab = ref<TabValue>("pending");
const processingBookingId = ref<string | null>(null);
const dialogOpen = ref(false);
const selectedBooking = ref<BookingViewModel | null>(null);
const dialogActionType = ref<"approve" | "reject" | "cancel">("approve");
const actionProcessing = ref(false);
const error = ref<string | null>(null);
const notification = ref<{ type: "success" | "error"; message: string } | null>(null);

// Toast helper
const showNotification = (type: "success" | "error", message: string) => {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 5000);
};

// Composables
const { bookings, isLoading, pagination, filters, fetchBookings, nextPage, prevPage } = useBookings(
  {
    role: "trainer",
    initialStatus: [BookingStatus.PENDING],
  }
);

const { approveBooking, rejectBooking, cancelBooking } = useBookingActions();

// Computed
const pendingCount = computed(() => {
  if (activeTab.value === "pending") {
    return pagination.value.totalItems;
  }
  return 0;
});

// Tab mapping to status
const getStatusForTab = (tab: TabValue): BookingStatus[] => {
  switch (tab) {
    case "pending":
      return [BookingStatus.PENDING];
    case "upcoming":
      return [BookingStatus.ACCEPTED];
    case "rejected":
      return [BookingStatus.REJECTED];
    case "cancelled":
      return [BookingStatus.CANCELLED];
    default:
      return [BookingStatus.PENDING];
  }
};

// Handlers
const handleTabChange = (value: string) => {
  activeTab.value = value as TabValue;
  filters.status = getStatusForTab(activeTab.value);
  filters.page = 1;

  // Update URL
  router.push({
    query: {
      tab: value,
      page: "1",
    },
  });

  fetchBookings();
};

const handleApprove = async (booking: BookingViewModel) => {
  selectedBooking.value = booking;
  dialogActionType.value = "approve";
  dialogOpen.value = true;
};

const handleReject = async (booking: BookingViewModel) => {
  selectedBooking.value = booking;
  dialogActionType.value = "reject";
  dialogOpen.value = true;
};

const handleCancelClick = async (booking: BookingViewModel) => {
  selectedBooking.value = booking;
  dialogActionType.value = "cancel";
  dialogOpen.value = true;
};

const handleDialogConfirm = async () => {
  if (!selectedBooking.value) return;

  actionProcessing.value = true;
  processingBookingId.value = selectedBooking.value.id;

  try {
    let result = null;
    let successMessage = "";

    switch (dialogActionType.value) {
      case "approve":
        result = await approveBooking(selectedBooking.value.id);
        successMessage = "Rezerwacja została zaakceptowana";
        break;
      case "reject":
        result = await rejectBooking(selectedBooking.value.id);
        successMessage = "Rezerwacja została odrzucona";
        break;
      case "cancel":
        result = await cancelBooking(selectedBooking.value.id);
        successMessage = "Rezerwacja została anulowana";
        break;
    }

    if (result) {
      showNotification("success", successMessage);

      // Refresh the list
      await fetchBookings();
    } else {
      showNotification("error", "Nie udało się wykonać operacji. Spróbuj ponownie.");
    }
  } catch (err: any) {
    console.error("Action failed:", err);
    showNotification("error", err.message || "Wystąpił nieoczekiwany błąd");
  } finally {
    actionProcessing.value = false;
    processingBookingId.value = null;
    dialogOpen.value = false;
    selectedBooking.value = null;
  }
};

const handleDialogCancel = () => {
  dialogOpen.value = false;
  selectedBooking.value = null;
};

// Initialize from URL
onMounted(() => {
  const tabFromQuery = route.query.tab as TabValue | undefined;
  const pageFromQuery = route.query.page ? parseInt(route.query.page as string) : 1;

  if (tabFromQuery && ["pending", "upcoming", "rejected", "cancelled"].includes(tabFromQuery)) {
    activeTab.value = tabFromQuery;
    filters.status = getStatusForTab(tabFromQuery);
  }

  if (pageFromQuery > 1) {
    filters.page = pageFromQuery;
  }

  fetchBookings();
});

// Watch for page changes in URL
watch(
  () => route.query.page,
  (newPage) => {
    const page = newPage ? parseInt(newPage as string) : 1;
    if (page !== filters.page) {
      filters.page = page;
    }
  }
);
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(1rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
