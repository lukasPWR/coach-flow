<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ref } from 'vue'
import { type DateValue, getLocalTimeZone, today } from '@internationalized/date'

interface Props {
  trainerId: string
}

defineProps<Props>()

const value = ref<DateValue>(today(getLocalTimeZone()))

// Placeholder for future implementation
const handleBooking = () => {
  console.log('Booking logic to be implemented for:', value.value)
}
</script>

<template>
  <Card class="sticky top-4 md:border md:shadow-sm border-0 shadow-none">
    <CardHeader>
      <CardTitle>Dostępność</CardTitle>
      <CardDescription>Wybierz termin, aby umówić się na trening</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex justify-center">
        <Calendar v-model="value" mode="single" class="rounded-md border" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <div class="h-3 w-3 rounded-full bg-primary"></div>
          <span>Dostępne terminy</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <div class="h-3 w-3 rounded-full bg-muted"></div>
          <span>Zajęte/Niedostępne</span>
        </div>
      </div>

      <Button class="w-full" @click="handleBooking"> Zarezerwuj termin </Button>
    </CardContent>
  </Card>
</template>
