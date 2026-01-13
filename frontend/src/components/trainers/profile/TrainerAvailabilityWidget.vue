<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ref, onMounted, computed, watch } from "vue";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useRoute, useRouter } from "vue-router";
import { AlertCircle } from "lucide-vue-next";
import { api } from "@/lib/api/client";
import { createBooking } from "@/lib/api/booking";
import { buildTimeSlots } from "@/lib/booking/timeSlots";
import { useAuthStore } from "@/stores/auth";
import type { TimeSlot } from "@/types/bookings";
import type { TrainerServiceViewModel } from "@/types/trainer";

interface Props {
  trainerId: string;
  selectedService?: TrainerServiceViewModel | null;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const timeZone = getLocalTimeZone();

interface Unavailability {
  id: string;
  startTime: string;
  endTime: string;
}

interface BookedSlot {
  startTime: string;
  endTime: string;
}

const selectedDate = ref<CalendarDate>(today(timeZone));
const selectedSlot = ref<TimeSlot | null>(null);
const unavailabilities = ref<Unavailability[]>([]);
const bookedSlots = ref<BookedSlot[]>([]);
const isLoadingUnavailabilities = ref(false);
const hasAvailabilityError = ref(false);
const isSubmitting = ref(false);
const toastMessage = ref<{ type: "success" | "error"; text: string } | null>(null);

onMounted(async () => {
  await loadAvailability();
});

const getDayRange = (date: CalendarDate) => {
  const base = date.toDate(timeZone);
  const from = new Date(base);
  const to = new Date(base);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

const getDayRangeParams = (date: CalendarDate) => {
  const range = getDayRange(date);
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  };
};

const loadAvailability = async () => {
  try {
    isLoadingUnavailabilities.value = true;
    const { from, to } = getDayRangeParams(selectedDate.value as CalendarDate);
    const [unavailabilityResult, bookedResult] = await Promise.allSettled([
      api.get<Unavailability[]>(`/trainers/${props.trainerId}/unavailabilities`, {
        params: { from, to },
      }),
      api.get<BookedSlot[]>(`/trainers/${props.trainerId}/booked-slots`, {
        params: { from, to },
      }),
    ]);

    let hasError = false;

    if (unavailabilityResult.status === "fulfilled") {
      unavailabilities.value = unavailabilityResult.value.data;
    } else {
      console.error("Failed to load unavailabilities", unavailabilityResult.reason);
      unavailabilities.value = [];
      hasError = true;
    }

    if (bookedResult.status === "fulfilled") {
      bookedSlots.value = bookedResult.value.data;
    } else {
      console.error("Failed to load booked slots", bookedResult.reason);
      bookedSlots.value = [];
      hasError = true;
    }

    hasAvailabilityError.value = hasError;
  } catch (error) {
    console.error("Failed to load availability data", error);
    unavailabilities.value = [];
    bookedSlots.value = [];
    hasAvailabilityError.value = true;
  } finally {
    isLoadingUnavailabilities.value = false;
  }
};

const handleRefreshAvailability = async () => {
  await loadAvailability();
};

const workHours = {
  start: 8,
  end: 20,
};

const isServiceSelected = computed(() => !!props.selectedService);

const dailyUnavailabilities = computed(() => {
  const { from, to } = getDayRange(selectedDate.value as CalendarDate);
  return unavailabilities.value.filter((unavail) => {
    const start = new Date(unavail.startTime);
    const end = new Date(unavail.endTime);
    return start <= to && end >= from;
  });
});

const dailyBookedSlots = computed(() => {
  const { from, to } = getDayRange(selectedDate.value as CalendarDate);
  return bookedSlots.value.filter((slot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    return start <= to && end >= from;
  });
});

const blockedRanges = computed(() => {
  return [...dailyUnavailabilities.value, ...dailyBookedSlots.value];
});

const timeSlots = computed<TimeSlot[]>(() => {
  if (!props.selectedService) return [];
  return buildTimeSlots({
    date: selectedDate.value as CalendarDate,
    durationMinutes: props.selectedService.durationMinutes,
    unavailabilities: blockedRanges.value,
    workHours,
  });
});

watch(selectedDate, (value) => {
  const minDate = today(timeZone);
  if (value.toDate(timeZone) < minDate.toDate(timeZone)) {
    selectedDate.value = minDate;
  }
  loadAvailability();
});

watch([() => props.selectedService?.id, selectedDate], () => {
  selectedSlot.value = null;
});

const showToast = (type: "success" | "error", text: string) => {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (date: CalendarDate) => {
  return date.toDate(timeZone).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const selectedSlotLabel = computed(() => {
  if (!selectedSlot.value) return null;
  return `${formatDate(selectedDate.value as CalendarDate)} - ${formatTime(selectedSlot.value.start)}`;
});

const handleSelectSlot = (slot: TimeSlot) => {
  if (!slot.isAvailable) return;
  selectedSlot.value = slot;
};

const handleBooking = async () => {
  if (!props.selectedService || !selectedSlot.value) return;

  if (!authStore.isAuthenticated) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  isSubmitting.value = true;
  try {
    await createBooking({
      trainerId: props.trainerId,
      serviceId: props.selectedService.id,
      startTime: selectedSlot.value.start.toISOString(),
    });

    showToast("success", "Wniosek rezerwacji został wysłany.");
    selectedSlot.value = null;
    router.push({ name: authStore.isTrainer ? "trainer-dashboard" : "dashboard" });
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401) {
      router.push({ name: "login", query: { redirect: route.fullPath } });
      return;
    }

    if (status === 400) {
      showToast("error", "Termin jest już zajęty. Wybierz inny slot.");
      return;
    }

    showToast("error", "Nie udało się zarezerwować terminu. Spróbuj ponownie.");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Card class="sticky top-4 md:border md:shadow-sm border-0 shadow-none">
    <CardHeader>
      <CardTitle>Dostępność</CardTitle>
      <CardDescription v-if="!isServiceSelected">
        Wybierz usługę z listy, aby sprawdzić dostępne terminy.
      </CardDescription>
      <CardDescription v-else> Wybierz datę i godzinę wizyty. </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
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
        >
          <AlertCircle v-if="toastMessage.type === 'error'" class="h-4 w-4" />
          <AlertTitle>{{ toastMessage.type === "error" ? "Błąd" : "Sukces" }}</AlertTitle>
          <AlertDescription>{{ toastMessage.text }}</AlertDescription>
        </Alert>
      </Transition>

      <div v-if="!isServiceSelected" class="rounded-md border border-dashed p-4 text-sm">
        Zaznacz usługę w sekcji po lewej, aby zobaczyć dostępne terminy rezerwacji.
      </div>

      <div v-else class="space-y-4">
        <div class="flex justify-center">
          <Calendar v-model="selectedDate as any" mode="single" class="rounded-md border" />
        </div>

        <div v-if="isLoadingUnavailabilities" class="text-sm text-muted-foreground">
          Ładowanie dostępności...
        </div>
        <div
          v-else-if="hasAvailabilityError"
          class="flex items-center justify-between gap-2 text-xs text-muted-foreground"
        >
          <span>Nie udało się pobrać zajętości. Pokazujemy orientacyjne terminy.</span>
          <Button
            size="sm"
            variant="outline"
            :disabled="isLoadingUnavailabilities"
            @click="handleRefreshAvailability"
          >
            Odśwież
          </Button>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium">Dostępne godziny na {{ formatDate(selectedDate as CalendarDate) }}</p>
          <div v-if="timeSlots.length > 0" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button
              v-for="slot in timeSlots"
              :key="slot.start.toISOString()"
              size="sm"
              class="w-full"
              :variant="
                selectedSlot?.start.getTime() === slot.start.getTime() ? 'default' : 'outline'
              "
              :disabled="!slot.isAvailable"
              @click="handleSelectSlot(slot)"
            >
              {{ formatTime(slot.start) }}
            </Button>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            Brak dostępnych terminów w tym dniu.
          </div>
        </div>

        <div v-if="props.selectedService" class="rounded-md border bg-muted/30 p-3 text-sm">
          <div class="font-medium">Wybrana usługa</div>
          <div class="text-muted-foreground">
            {{ props.selectedService.name }} - {{ props.selectedService.durationFormatted }} -
            {{ props.selectedService.priceFormatted }}
          </div>
          <div v-if="selectedSlotLabel" class="mt-2 text-muted-foreground">
            Termin: <span class="font-medium text-foreground">{{ selectedSlotLabel }}</span>
          </div>
        </div>

        <Button class="w-full" :disabled="!selectedSlot || isSubmitting" @click="handleBooking">
          {{ isSubmitting ? "Rezerwuję..." : "Zarezerwuj termin" }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
