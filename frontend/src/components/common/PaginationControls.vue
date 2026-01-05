<template>
  <div class="flex items-center justify-between px-2 pt-4">
    <div class="text-sm text-muted-foreground">
      Strona {{ currentPage }} z {{ totalPages }}
    </div>
    <div class="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage <= 1"
        @click="$emit('prev')"
      >
        Poprzednia
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="currentPage >= totalPages"
        @click="$emit('next')"
      >
        Następna
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{
  currentPage: number
  totalPages: number
}>()

defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

