<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { useOnboarding } from "@/composables/useOnboarding";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-vue-next";
import type { CreateUnavailabilityDto } from "@/types/onboarding";

const { unavailabilities, fetchUnavailabilities, submitUnavailability, removeUnavailability } =
  useOnboarding();

// Use CalendarDate from @internationalized/date (required by radix-vue)
const selectedDate = ref<CalendarDate>(today(getLocalTimeZone()));

// Load existing unavailabilities on mount
onMounted(async () => {
  await fetchUnavailabilities();
});

const startTime = ref("09:00");
const endTime = ref("17:00");

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return "";
  // Convert CalendarDate to displayable string
  return `${selectedDate.value.day}.${selectedDate.value.month}.${selectedDate.value.year}`;
});

const handleAddUnavailability = async () => {
  if (!selectedDate.value || !startTime.value || !endTime.value) return;

  // Convert CalendarDate to native Date for ISO string generation
  const [startHour, startMinute] = startTime.value.split(":").map(Number);
  const [endHour, endMinute] = endTime.value.split(":").map(Number);

  const startDateTime = new Date(
    selectedDate.value.year,
    selectedDate.value.month - 1,
    selectedDate.value.day,
    startHour,
    startMinute
  );

  const endDateTime = new Date(
    selectedDate.value.year,
    selectedDate.value.month - 1,
    selectedDate.value.day,
    endHour,
    endMinute
  );

  if (endDateTime <= startDateTime) {
    alert("Data zakończenia musi być późniejsza niż data rozpoczęcia");
    return;
  }

  const payload: CreateUnavailabilityDto = {
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
  };

  try {
    await submitUnavailability(payload);
    alert("Niedostępność dodana pomyślnie!");
  } catch (error: any) {
    console.error("Failed to add unavailability", error);
    console.error("Error response:", error.response?.data);
    const errorMsg = error.response?.data?.message || "Nie udało się dodać niedostępności";
    alert(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg);
  }
};

const formatTimeRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

// Get unavailabilities for the currently displayed month (for the legend)
const getUnavailabilitiesForMonth = () => {
  if (!selectedDate.value) return [];

  return unavailabilities.value.filter((unavail) => {
    const unavailDate = new Date(unavail.startTime);
    return (
      unavailDate.getFullYear() === selectedDate.value.year &&
      unavailDate.getMonth() + 1 === selectedDate.value.month
    );
  });
};

const handleRemoveUnavailability = async (id: string) => {
  try {
    await removeUnavailability(id);
    alert("Niedostępność usunięta pomyślnie!");
  } catch (error) {
    console.error("Failed to remove unavailability", error);
    alert("Nie udało się usunąć niedostępności");
  }
};
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <!-- Calendar Column -->
    <div class="space-y-4">
      <div class="flex flex-col space-y-2">
        <h3 class="font-medium">Wybierz dzień</h3>
        <p class="text-sm text-muted-foreground">
          Zaznacz dzień, w którym chcesz dodać wyjątek od dostępności.
        </p>
      </div>
      <div class="space-y-3">
        <div class="border rounded-md p-4 flex justify-center">
          <!-- Calendar now uses CalendarDate from @internationalized/date -->
          <Calendar v-model="selectedDate as any"
class="rounded-md border" />
        </div>

        <!-- Legend showing unavailability indicators -->
        <div v-if="unavailabilities.length > 0"
class="text-xs text-muted-foreground space-y-1">
          <p class="font-medium">Twoje niedostępności:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li v-for="unavail in getUnavailabilitiesForMonth()"
:key="unavail.id">
              {{ formatDate(unavail.startTime) }} -
              {{ formatTimeRange(unavail.startTime, unavail.endTime) }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form Column -->
    <div class="space-y-6">
      <div class="flex flex-col space-y-2">
        <h3 class="font-medium">Zarządzaj dostępnością</h3>
        <p class="text-sm text-muted-foreground">
          Dodaj godziny niedostępności dla:
          <span class="font-semibold text-primary">{{ formattedSelectedDate }}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base"> Dodaj przerwę / urlop </CardTitle>
          <CardDescription>Określ godziny, w których nie przyjmujesz rezerwacji.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Od godziny</Label>
              <Input v-model="startTime"
type="time" />
            </div>
            <div class="space-y-2">
              <Label>Do godziny</Label>
              <Input v-model="endTime"
type="time" />
            </div>
          </div>
          <Button class="w-full"
@click="handleAddUnavailability" :disabled="!selectedDate">
            <Plus class="w-4 h-4 mr-2" />
            Dodaj niedostępność
          </Button>
        </CardContent>
      </Card>

      <!-- List of added unavailabilities -->
      <div v-if="unavailabilities.length > 0"
class="space-y-2">
        <h4 class="text-sm font-medium">Dodane wyjątki:</h4>
        <div class="space-y-2">
          <div
            v-for="item in unavailabilities"
            :key="item.id"
            class="flex items-center justify-between border rounded p-2 text-sm"
          >
            <div>
              <span class="font-medium">{{ formatDate(item.startTime) }}</span>
              <span class="text-muted-foreground ml-2">{{
                formatTimeRange(item.startTime, item.endTime)
              }}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-destructive"
              @click="handleRemoveUnavailability(item.id)"
            >
              <Trash2 class="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
