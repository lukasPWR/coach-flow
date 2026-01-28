<template>
  <Dialog :open="open"
@update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Zmień termin</DialogTitle>
        <DialogDescription> Wybierz nową datę i godzinę dla swojej rezerwacji. </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="datetime"
class="text-right">Data</Label>
          <Input id="datetime"
type="datetime-local" v-model="newDate" class="col-span-3" />
        </div>
      </div>

      <DialogFooter>
        <Button
variant="outline" @click="$emit('update:open', false)"> Anuluj </Button>
        <Button :disabled="isLoading || !newDate"
@click="handleConfirm">
          {{ isLoading ? "Zapisywanie..." : "Zapisz zmiany" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingViewModel } from "@/types/bookings";

const props = defineProps<{
  open: boolean;
  booking: BookingViewModel | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [booking: BookingViewModel, newDate: string];
}>();

const newDate = ref("");
const isLoading = ref(false);

watch(
  () => props.booking,
  (newVal) => {
    if (newVal) {
      const date = new Date(newVal.startTime);
      // Adjust to local timezone for datetime-local input
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      newDate.value = date.toISOString().slice(0, 16);
    }
  }
);

// Reset loading state when dialog opens/closes
watch(
  () => props.open,
  () => {
    isLoading.value = false;
  }
);

const handleConfirm = () => {
  if (!props.booking || !newDate.value) return;
  isLoading.value = true;

  // We need to be careful with timezone here.
  // datetime-local value is like "2023-01-01T12:00" in local time.
  // new Date("2023-01-01T12:00") creates date in local time.
  // toISOString() converts to UTC.
  const date = new Date(newDate.value);
  emit("confirm", props.booking, date.toISOString());
};
</script>
