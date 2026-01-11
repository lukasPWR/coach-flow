<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ScheduleItem from "./ScheduleItem.vue";
import type { DailySessionVM } from "@/types/dashboard";

defineProps<{
  sessions: DailySessionVM[];
  isLoading: boolean;
}>();
</script>

<template>
  <Card class="h-full">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-lg">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Dzisiejszy plan
        </CardTitle>
        <span v-if="!isLoading && sessions.length > 0" class="text-sm text-muted-foreground">
          {{ sessions.length }}
          {{ sessions.length === 1 ? "sesja" : sessions.length < 5 ? "sesje" : "sesji" }}
        </span>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Loading state -->
      <template v-if="isLoading">
        <div class="space-y-3">
          <div v-for="i in 4" :key="i" class="flex items-center gap-4">
            <Skeleton class="h-10 w-20 rounded" />
            <Skeleton class="h-2.5 w-2.5 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-24" />
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-else-if="sessions.length === 0"
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 class="font-medium text-foreground mb-1">Wolny dzień!</h3>
        <p class="text-sm text-muted-foreground">Nie masz zaplanowanych treningów na dziś.</p>
      </div>

      <!-- Sessions list -->
      <div v-else class="space-y-1">
        <ScheduleItem v-for="session in sessions" :key="session.id" :session="session" />
      </div>
    </CardContent>
  </Card>
</template>
