<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { CalendarCell, type CalendarCellProps, useForwardProps } from "radix-vue";
import { cn } from "@/lib/utils";

const props = defineProps<CalendarCellProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarCell
    :class="
      cn(
        'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
        props.class
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarCell>
</template>
