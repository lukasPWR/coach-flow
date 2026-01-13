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
              <p class="text-lg font-semibold leading-none">
                {{ booking.formattedDate }}
              </p>
              <p class="text-sm text-muted-foreground mt-1">
                {{ booking.formattedTime }} • {{ booking.service.durationMinutes }} min
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <Avatar class="h-8 w-8">
              <AvatarImage
                v-if="booking.client.profilePictureUrl"
                :src="booking.client.profilePictureUrl"
                :alt="booking.client.name"
              />
              <AvatarFallback>{{ clientInitials }}</AvatarFallback>
            </Avatar>
            <div class="text-sm">
              <span class="font-medium mr-2">{{ booking.client.name }}</span>
              <span class="text-muted-foreground">{{ formatPrice(booking.service.price) }}</span>
            </div>
          </div>
        </div>

        <div v-if="showActions" class="flex gap-2 sm:flex-col sm:ml-2">
          <Button
            v-if="booking.status === BookingStatus.PENDING"
            size="sm"
            variant="default"
            :disabled="isProcessing"
            @click="$emit('approve', booking)"
          >
            <Check class="h-4 w-4 mr-1" />
            Akceptuj
          </Button>
          <Button
            v-if="booking.status === BookingStatus.PENDING"
            size="sm"
            variant="outline"
            :disabled="isProcessing"
            @click="$emit('reject', booking)"
          >
            <X class="h-4 w-4 mr-1" />
            Odrzuć
          </Button>
          <Button
            v-if="canCancel"
            size="sm"
            variant="destructive"
            :disabled="isProcessing"
            @click="$emit('cancel', booking)"
          >
            <Ban class="h-4 w-4 mr-1" />
            Anuluj
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar, Check, X, Ban } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookingStatusBadge from "./BookingStatusBadge.vue";
import type { BookingViewModel } from "@/types/bookings";
import { BookingStatus } from "@/types/bookings";
import { formatPrice } from "@/lib/utils";

const props = defineProps<{
  booking: BookingViewModel;
  isProcessing?: boolean;
}>();

defineEmits<{
  approve: [booking: BookingViewModel];
  reject: [booking: BookingViewModel];
  cancel: [booking: BookingViewModel];
}>();

const clientInitials = computed(() => {
  return props.booking.client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const canCancel = computed(() => {
  return (
    (props.booking.status === BookingStatus.PENDING ||
      props.booking.status === BookingStatus.ACCEPTED) &&
    props.booking.isUpcoming
  );
});

const showActions = computed(() => {
  return props.booking.status === BookingStatus.PENDING || canCancel.value;
});
</script>
