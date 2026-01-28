<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { CalendarGridHead, type CalendarGridHeadProps, useForwardProps } from "radix-vue";

const props = defineProps<CalendarGridHeadProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarGridHead v-bind="forwardedProps">
    <slot />
  </CalendarGridHead>
</template>
