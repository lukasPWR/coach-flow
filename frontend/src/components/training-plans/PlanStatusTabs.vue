<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanStatus } from '@/types/training-plans';

defineProps<{
  modelValue: PlanStatus;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PlanStatus): void;
}>();

const onUpdate = (val: string | number) => {
  emit('update:modelValue', val as PlanStatus);
};
</script>

<template>
  <Tabs :model-value="modelValue" @update:model-value="onUpdate" class="w-full sm:w-auto">
    <TabsList class="grid w-full grid-cols-2 sm:w-[300px]">
      <TabsTrigger :value="PlanStatus.ACTIVE">Aktywne</TabsTrigger>
      <TabsTrigger :value="PlanStatus.ARCHIVED">Zarchiwizowane</TabsTrigger>
    </TabsList>
  </Tabs>
</template>
