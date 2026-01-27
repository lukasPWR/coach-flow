<script setup lang="ts">
import { cn } from '@/lib/utils'
import { useFormField } from './useFormField'

const props = defineProps<{
  class?: any
}>()

const { formDescriptionId } = useFormField()
</script>

<template>
  <p
    :id="formDescriptionId"
    :class="cn('text-[0.8rem] text-muted-foreground', props.class)"
  >
    <slot />
  </p>
</template>
