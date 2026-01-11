<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { computed } from "vue";

const props = defineProps<{
  title: string;
  description: string;
  icon: string;
  to: string;
  color?: "default" | "primary" | "success" | "warning";
}>();

const colorClasses = computed(() => {
  const colors = {
    default: "bg-muted/50 text-muted-foreground group-hover:bg-muted",
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20",
  };
  return colors[props.color ?? "default"];
});
</script>

<template>
  <RouterLink :to="to" class="block group">
    <Card
      class="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer"
    >
      <CardContent class="p-5">
        <div class="flex items-start gap-4">
          <div
            :class="[
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
              colorClasses,
            ]"
          >
            <span class="text-2xl">{{ icon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-foreground group-hover:text-primary transition-colors truncate"
            >
              {{ title }}
            </h3>
            <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
              {{ description }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </RouterLink>
</template>
