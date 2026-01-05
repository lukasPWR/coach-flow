<template>
  <Card class="overflow-hidden transition-all hover:shadow-md">
    <CardContent class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-4 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="outline" class="font-normal">
              {{ booking.service.name }}
            </Badge>
            <BookingStatusBadge :status="booking.status" />
          </div>

          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <Calendar class="h-6 w-6" />
            </div>
            <div>
              <p class="text-lg font-semibold leading-none">{{ booking.formattedDate }}</p>
              <p class="text-sm text-muted-foreground mt-1">
                {{ booking.formattedTime }} • {{ booking.service.durationMinutes }} min
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <Avatar class="h-8 w-8">
              <AvatarImage
                :src="booking.trainer.profilePictureUrl || undefined"
                :alt="booking.trainer.name"
              />
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
            <div class="text-sm">
              <span class="font-medium mr-2">{{ booking.trainer.name }}</span>
              <span class="text-muted-foreground">{{ formatPrice(booking.service.price) }}</span>
            </div>
          </div>
        </div>

        <div v-if="booking.canCancel || booking.canReschedule" class="flex justify-end sm:ml-2">
          <BookingActionsMenu
            :can-cancel="booking.canCancel"
            :can-reschedule="booking.canReschedule"
            @cancel="$emit('cancel', booking)"
            @reschedule="$emit('reschedule', booking)"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import BookingStatusBadge from './BookingStatusBadge.vue'
import BookingActionsMenu from './BookingActionsMenu.vue'
import type { BookingViewModel } from '@/types/bookings'
import { formatPrice } from '@/lib/utils'

const props = defineProps<{
  booking: BookingViewModel
}>()

defineEmits<{
  (e: 'cancel', booking: BookingViewModel): void
  (e: 'reschedule', booking: BookingViewModel): void
}>()

const initials = computed(() => {
  return props.booking.trainer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>
