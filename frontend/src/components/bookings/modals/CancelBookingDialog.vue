<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Anuluj rezerwację</DialogTitle>
        <DialogDescription>
          Czy na pewno chcesz anulować rezerwację?
        </DialogDescription>
      </DialogHeader>
      
      <div v-if="isLateCancellation" class="bg-destructive/10 p-4 rounded-md flex items-start space-x-2 text-destructive">
         <AlertTriangle class="h-5 w-5 mt-0.5 shrink-0" />
         <div class="text-sm">
           <p class="font-semibold">Późne anulowanie</p>
           <p>Do wizyty zostało mniej niż 12 godzin. Anulowanie może skutkować tymczasową blokadą konta.</p>
         </div>
      </div>
      <div v-else class="text-sm text-muted-foreground">
        Spokojnie, jeśli anulujesz teraz, nie poniesiesz żadnych konsekwencji.
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Wróć</Button>
        <Button variant="destructive" @click="handleConfirm" :disabled="isLoading">
          {{ isLoading ? 'Anulowanie...' : 'Potwierdź anulowanie' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { BookingViewModel } from '@/types/bookings'

const props = defineProps<{
  open: boolean
  booking: BookingViewModel | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', booking: BookingViewModel): void
}>()

const isLoading = ref(false)

const isLateCancellation = computed(() => {
  if (!props.booking) return false
  const now = new Date()
  const start = new Date(props.booking.startTime)
  const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffHours < 12
})

// Reset loading state when dialog opens/closes
watch(() => props.open, () => {
  isLoading.value = false
})

const handleConfirm = async () => {
  if (!props.booking) return
  isLoading.value = true
  emit('confirm', props.booking)
  // Parent should close dialog or handle loading state logic. 
  // Here we just emit. If we want to show loading state inside dialog while API calls,
  // we might need to wait for parent or expose a method.
  // For simplicity, we just emit and let parent handle closure/refresh.
}
</script>

