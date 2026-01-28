<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronRight, CheckCircle2, Info } from "lucide-vue-next";
import type { DashboardNotificationDTO } from "@/types/dashboard";
import { useRouter } from "vue-router";

const props = defineProps<{
  notifications: DashboardNotificationDTO[];
}>();

const router = useRouter();

const hasNotifications = computed(() => props.notifications.length > 0);

const getIcon = (type: DashboardNotificationDTO["type"]) => {
  switch (type) {
    case "PLAN_ASSIGNED":
      return CheckCircle2;
    case "PLAN_UPDATED":
      return Info;
    default:
      return Info;
  }
};

const handleClick = (notification: DashboardNotificationDTO) => {
  if (notification.link) {
    router.push(notification.link);
  }
};
</script>

<template>
  <div v-if="hasNotifications">
    <Card class="border-l-4 border-l-primary bg-muted/30">
      <CardHeader class="pb-3 pt-4">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-semibold flex items-center gap-2">
            <Bell class="h-4 w-4 text-primary" />
            Powiadomienia
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent class="pb-4">
        <div class="space-y-3">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="flex items-start gap-3 p-3 bg-background rounded-md border shadow-sm cursor-pointer hover:bg-accent transition-colors"
            @click="handleClick(notification)"
          >
            <component
              :is="getIcon(notification.type)"
              class="h-5 w-5 mt-0.5 text-primary shrink-0"
            />
            <div class="flex-1 space-y-1">
              <p class="text-sm font-medium leading-none">
                {{ notification.title }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ notification.message }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[10px] text-muted-foreground whitespace-nowrap">
                {{ new Date(notification.date).toLocaleDateString() }}
              </span>
              <ChevronRight class="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
