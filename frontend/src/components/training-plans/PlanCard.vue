<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays } from "lucide-vue-next";
import { type TrainingPlanDTO, PlanStatus } from "@/types/training-plans";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const props = defineProps<{
  plan: TrainingPlanDTO;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const formattedDate = computed(() => {
  try {
    return format(new Date(props.plan.updatedAt), "d MMM yyyy", { locale: pl });
  } catch (e) {
    return props.plan.updatedAt;
  }
});

const clientInitials = computed(() => {
  const name = props.plan.clientName || "Client";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
});
</script>

<template>
  <Card
    class="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
    @click="$emit('click')"
  >
    <CardHeader class="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
      <CardTitle class="text-base font-semibold leading-tight line-clamp-2">
        {{ plan.name }}
      </CardTitle>
      <Badge
        :variant="plan.status === PlanStatus.ACTIVE ? 'default' : 'secondary'"
        class="shrink-0"
      >
        {{ plan.status }}
      </Badge>
    </CardHeader>
    <CardContent class="flex-grow">
      <div class="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
        <Avatar class="h-6 w-6">
          <AvatarImage v-if="plan.clientAvatar" :src="plan.clientAvatar" />
          <AvatarFallback class="text-[10px]">
            {{ clientInitials }}
          </AvatarFallback>
        </Avatar>
        <span class="truncate">{{ plan.clientName || "Unknown Client" }}</span>
      </div>
    </CardContent>
    <CardFooter class="text-xs text-muted-foreground pt-0 mt-auto">
      <div class="flex items-center">
        <CalendarDays class="mr-1 h-3 w-3" />
        <span>Aktualizacja {{ formattedDate }}</span>
      </div>
    </CardFooter>
  </Card>
</template>
