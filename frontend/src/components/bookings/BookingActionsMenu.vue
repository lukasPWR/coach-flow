<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Otwórz menu</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="$emit('reschedule')" v-if="canReschedule">
        Zmień termin
      </DropdownMenuItem>
      <DropdownMenuItem @click="$emit('cancel')" v-if="canCancel" class="text-destructive focus:text-destructive">
        Anuluj
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
  canCancel: boolean
  canReschedule: boolean
}>()

defineEmits<{
  (e: 'reschedule'): void
  (e: 'cancel'): void
}>()
</script>

