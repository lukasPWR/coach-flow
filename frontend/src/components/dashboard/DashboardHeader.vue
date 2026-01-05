<template>
  <div class="flex flex-col space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Cześć, {{ userName }}! 👋</h1>
    <p class="text-muted-foreground capitalize">Dziś jest {{ currentDate }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps<{
  userName: string
}>()

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
})
</script>
