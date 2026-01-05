<script setup lang="ts">
interface Props {
  description: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-2xl font-semibold tracking-tight">O mnie</h2>
    <div class="prose prose-neutral max-w-none text-muted-foreground">
      <p class="whitespace-pre-line">{{ description }}</p>
    </div>
  </div>
</template>
