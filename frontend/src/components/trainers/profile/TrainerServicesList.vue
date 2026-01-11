<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrainerServiceViewModel } from "@/types/trainer";

interface Props {
  services: TrainerServiceViewModel[];
  selectedServiceId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedServiceId: null,
});

const emit = defineEmits<{
  select: [service: TrainerServiceViewModel];
}>();
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-semibold tracking-tight">Usługi i cennik</h2>

    <div v-if="services.length === 0" class="text-muted-foreground">
      Trener nie zdefiniował jeszcze żadnych usług.
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <Card
        v-for="service in services"
        :key="service.id"
        class="transition-colors"
        :class="{
          'border-primary ring-1 ring-primary/40': props.selectedServiceId === service.id,
        }"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-base font-medium">
            {{ service.name }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold">{{ service.priceFormatted }}</span>
            <div class="flex items-center text-sm text-muted-foreground">
              <Clock class="mr-1 h-4 w-4" />
              <span>{{ service.durationFormatted }}</span>
            </div>
          </div>
          <Button
            size="sm"
            class="w-full"
            :variant="props.selectedServiceId === service.id ? 'default' : 'outline'"
            @click="emit('select', service)"
          >
            {{ props.selectedServiceId === service.id ? "Wybrano" : "Wybierz" }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
