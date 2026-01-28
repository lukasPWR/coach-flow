<template>
  <Dialog :open="open"
@update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="showLateCancelWarning"
class="rounded-lg bg-destructive/10 p-4 my-4">
        <div class="flex gap-3">
          <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-sm font-medium text-destructive">Uwaga! Późne anulowanie</p>
            <p class="text-sm text-muted-foreground">
              Anulowanie rezerwacji na mniej niż 12 godzin przed terminem skutkuje blokadą konta na
              7 dni.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
variant="outline" @click="handleCancel" :disabled="isProcessing"> Anuluj </Button>
        <Button
          :variant="actionType === 'reject' || actionType === 'cancel' ? 'destructive' : 'default'"
          :disabled="isProcessing"
          @click="handleConfirm"
        >
          <span v-if="isProcessing"
class="flex items-center gap-2">
            <span
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Przetwarzanie...
          </span>
          <span v-else>{{ confirmLabel }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AlertCircle } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BookingViewModel } from "@/types/bookings";

const props = defineProps<{
  open: boolean;
  booking: BookingViewModel | null;
  actionType: "approve" | "reject" | "cancel";
  isProcessing?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  "update:open": [value: boolean];
}>();

const title = computed(() => {
  switch (props.actionType) {
    case "approve":
      return "Zaakceptuj rezerwację";
    case "reject":
      return "Odrzuć rezerwację";
    case "cancel":
      return "Anuluj rezerwację";
    default:
      return "";
  }
});

const description = computed(() => {
  switch (props.actionType) {
    case "approve":
      return "Czy na pewno chcesz zaakceptować tę rezerwację?";
    case "reject":
      return "Czy na pewno chcesz odrzucić tę rezerwację? Ta akcja jest nieodwracalna.";
    case "cancel":
      return "Czy na pewno chcesz anulować tę rezerwację?";
    default:
      return "";
  }
});

const confirmLabel = computed(() => {
  switch (props.actionType) {
    case "approve":
      return "Zaakceptuj";
    case "reject":
      return "Odrzuć";
    case "cancel":
      return "Anuluj rezerwację";
    default:
      return "Potwierdź";
  }
});

const showLateCancelWarning = computed(() => {
  if (props.actionType !== "cancel" || !props.booking) return false;

  const now = new Date();
  const startTime = new Date(props.booking.startTime);
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Show warning if canceling less than 12 hours before start and booking is ACCEPTED
  return hoursUntilStart < 12 && props.booking.status === "ACCEPTED";
});

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("cancel");
};

const handleOpenChange = (value: boolean) => {
  if (!props.isProcessing) {
    emit("update:open", value);
  }
};
</script>
