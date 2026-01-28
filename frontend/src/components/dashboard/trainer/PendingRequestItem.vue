<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PendingBookingVM } from "@/types/dashboard";

const props = defineProps<{
  request: PendingBookingVM;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();

const timerBadgeClass = computed(() => {
  if (props.request.isExpired) {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  if (props.request.isUrgent) {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse";
  }
  return "bg-muted text-muted-foreground border-border";
});

const cardClass = computed(() => {
  if (props.request.isExpired) {
    return "border-destructive/30 bg-destructive/5 opacity-75";
  }
  if (props.request.isUrgent) {
    return "border-amber-500/30 bg-amber-500/5";
  }
  return "";
});

function handleApprove() {
  if (!props.request.isExpired && !props.isLoading) {
    emit("approve", props.request.id);
  }
}

function handleReject() {
  if (!props.request.isExpired && !props.isLoading) {
    emit("reject", props.request.id);
  }
}
</script>

<template>
  <Card :class="['transition-all duration-200', cardClass]">
    <CardContent class="p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <!-- Info section -->
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-foreground truncate">
              {{ request.clientName }}
            </span>
            <Badge variant="outline"
class="text-xs shrink-0">
              {{ request.serviceName }}
            </Badge>
          </div>

          <div class="flex items-center gap-3 text-sm text-muted-foreground">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4"
fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {{ request.formattedDate }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4"
fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ request.formattedTime }}
            </span>
          </div>
        </div>

        <!-- Timer and actions -->
        <div class="flex items-center gap-3 sm:flex-col sm:items-end lg:flex-row lg:items-center">
          <!-- Expiration timer -->
          <Badge variant="outline"
:class="['text-xs font-medium px-2.5 py-1', timerBadgeClass]">
            <svg
              v-if="!request.isExpired"
              class="w-3.5 h-3.5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else
              class="w-3.5 h-3.5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {{ request.remainingTime }}
          </Badge>

          <!-- Action buttons -->
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="request.isExpired || isLoading"
              class="text-muted-foreground hover:text-destructive hover:border-destructive/50"
              @click="handleReject"
            >
              <span v-if="isLoading"
class="mr-1">
                <svg class="w-4 h-4 animate-spin"
fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </span>
              Odrzuć
            </Button>
            <Button
              size="sm"
              :disabled="request.isExpired || isLoading"
              class="bg-emerald-600 hover:bg-emerald-700 text-white"
              @click="handleApprove"
            >
              <span v-if="isLoading"
class="mr-1">
                <svg class="w-4 h-4 animate-spin"
fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </span>
              Akceptuj
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
