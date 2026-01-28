<script setup lang="ts">
import { computed } from "vue";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays } from "lucide-vue-next";
import { type ITrainingPlan, PlanStatus } from "@/types/training-plans";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const props = defineProps<{
  plan: ITrainingPlan;
}>();

const formattedDate = computed(() => {
  try {
    return format(new Date(props.plan.updatedAt), "d MMM yyyy", { locale: pl });
  } catch (_e) {
    return props.plan.updatedAt;
  }
});
</script>

<template>
  <Card class="cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
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
    <CardContent class="grow">
      <p v-if="plan.description" class="text-sm text-muted-foreground line-clamp-3">
        {{ plan.description }}
      </p>
      <p v-else class="text-sm text-muted-foreground italic">Brak opisu</p>
    </CardContent>
    <CardFooter class="text-xs text-muted-foreground pt-0 mt-auto">
      <div class="flex items-center">
        <CalendarDays class="mr-1 h-3 w-3" />
        <span>Aktualizacja {{ formattedDate }}</span>
      </div>
    </CardFooter>
  </Card>
</template>
