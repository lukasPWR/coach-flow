<script setup lang="ts">
import { Field as VeeField } from "vee-validate";

const props = defineProps<{
  name: string;
}>();
</script>

<template>
  <VeeField v-bind="props">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </VeeField>
</template>
