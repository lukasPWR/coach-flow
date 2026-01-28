<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PendingRequestItem from "./PendingRequestItem.vue";
import type { PendingBookingVM } from "@/types/dashboard";

defineProps<{
  requests: PendingBookingVM[];
  isLoading: boolean;
  isActionLoading: (_id: string) => boolean;
}>();

const emit = defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();

function handleApprove(id: string) {
  emit("approve", id);
}

function handleReject(id: string) {
  emit("reject", id);
}
</script>

<template>
  <Card class="h-full">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-lg">
          <svg class="w-5 h-5 text-amber-500"
fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Oczekujące wnioski
        </CardTitle>
        <span
          v-if="!isLoading && requests.length > 0"
          class="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600"
        >
          {{ requests.length }}
        </span>
      </div>
    </CardHeader>

    <CardContent class="space-y-3">
      <!-- Loading state -->
      <template v-if="isLoading">
        <div v-for="i in 3"
:key="i" class="space-y-2">
          <Skeleton class="h-20 w-full rounded-lg" />
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-else-if="requests.length === 0"
        class="flex flex-col items-center justify-center py-8 text-center"
      >
        <div class="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
          <svg
            class="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="font-medium text-foreground mb-1">Wszystko załatwione!</h3>
        <p class="text-sm text-muted-foreground">
          Nie masz żadnych oczekujących wniosków do rozpatrzenia.
        </p>
      </div>

      <!-- Requests list -->
      <template v-else>
        <TransitionGroup name="list"
tag="div" class="space-y-3">
          <PendingRequestItem
            v-for="request in requests"
            :key="request.id"
            :request="request"
            :is-loading="isActionLoading(request.id)"
            @approve="handleApprove"
            @reject="handleReject"
          />
        </TransitionGroup>
      </template>
    </CardContent>
  </Card>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
