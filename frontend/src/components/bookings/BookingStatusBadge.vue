<template>
  <Badge :variant="variant" class="whitespace-nowrap">
    {{ label }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { BookingStatus } from '@/types/bookings'

const props = defineProps<{
  status: BookingStatus
}>()

const variant = computed(() => {
  switch (props.status) {
    case BookingStatus.ACCEPTED:
      return 'default'
    case BookingStatus.PENDING:
      return 'secondary'
    case BookingStatus.REJECTED:
    case BookingStatus.CANCELLED:
      return 'destructive'
    default:
      return 'outline'
  }
})

const label = computed(() => {
  switch (props.status) {
    case BookingStatus.ACCEPTED:
      return 'Potwierdzona'
    case BookingStatus.PENDING:
      return 'Oczekująca'
    case BookingStatus.REJECTED:
      return 'Odrzucona'
    case BookingStatus.CANCELLED:
      return 'Anulowana'
    default:
      return props.status
  }
})
</script>

