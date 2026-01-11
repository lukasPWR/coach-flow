<script setup lang="ts">
import { computed } from "vue";
import type { DailySessionVM } from "@/types/dashboard";

const props = defineProps<{
  session: DailySessionVM;
}>();

const isPast = computed(() => {
  return new Date(props.session.endTime) < new Date();
});

const isOngoing = computed(() => {
  const now = new Date();
  const start = new Date(props.session.startTime);
  const end = new Date(props.session.endTime);
  return now >= start && now <= end;
});

const statusIndicatorClass = computed(() => {
  if (isOngoing.value) {
    return "bg-emerald-500 animate-pulse";
  }
  if (isPast.value) {
    return "bg-muted-foreground/30";
  }
  return "bg-primary";
});

const containerClass = computed(() => {
  if (isPast.value) {
    return "opacity-50";
  }
  if (isOngoing.value) {
    return "bg-emerald-500/5 border-l-emerald-500";
  }
  return "";
});
</script>

<template>
  <div
    :class="[
      'flex items-center gap-4 p-3 rounded-lg border-l-4 border-transparent transition-all',
      containerClass,
    ]"
  >
    <!-- Time indicator -->
    <div class="shrink-0 w-20 text-center">
      <div class="text-sm font-semibold text-foreground">
        {{ session.timeRange.split(" - ")[0] }}
      </div>
      <div class="text-xs text-muted-foreground">
        {{ session.timeRange.split(" - ")[1] }}
      </div>
    </div>

    <!-- Status dot -->
    <div class="shrink-0">
      <div :class="['w-2.5 h-2.5 rounded-full', statusIndicatorClass]" />
    </div>

    <!-- Session info -->
    <div class="flex-1 min-w-0">
      <div class="font-medium text-foreground truncate">
        {{ session.clientName }}
      </div>
      <div class="text-sm text-muted-foreground truncate">
        {{ session.serviceName }}
      </div>
    </div>

    <!-- Status label for ongoing -->
    <div v-if="isOngoing" class="shrink-0">
      <span
        class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600"
      >
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Trwa
      </span>
    </div>
  </div>
</template>
