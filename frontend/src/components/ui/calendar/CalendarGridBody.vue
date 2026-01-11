<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { CalendarGridBody, type CalendarGridBodyProps, useForwardProps } from "radix-vue";

const props = defineProps<CalendarGridBodyProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarGridBody v-bind="forwardedProps">
    <slot />
  </CalendarGridBody>
</template>
