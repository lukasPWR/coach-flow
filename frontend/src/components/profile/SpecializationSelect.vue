<script setup lang="ts">
import { computed } from 'vue'
import type { Specialization } from '@/types/trainer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X, Loader2 } from 'lucide-vue-next'

interface Props {
  modelValue: string[]
  specializations: Specialization[]
  isLoading?: boolean
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: undefined,
})

const emit = defineEmits<Emits>()

const toggleSpecialization = (id: string) => {
  const currentValue = [...props.modelValue]
  const index = currentValue.indexOf(id)

  if (index === -1) {
    currentValue.push(id)
  } else {
    currentValue.splice(index, 1)
  }

  emit('update:modelValue', currentValue)
}

const getSpecializationName = (id: string) => {
  return props.specializations.find((s) => s.id === id)?.name || id
}

const selectedCount = computed(() => props.modelValue.length)
</script>

<template>
  <div class="space-y-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          class="w-full justify-between"
          :class="{ 'border-destructive': error }"
        >
          {{ selectedCount > 0 ? `Wybrano: ${selectedCount}` : 'Wybierz specjalizacje' }}
          <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-full min-w-[300px] max-h-[300px] overflow-y-auto">
        <DropdownMenuLabel>Dostępne specjalizacje</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div v-if="isLoading" class="flex justify-center p-4">
          <Loader2 class="w-4 h-4 animate-spin" />
        </div>

        <div
          v-else-if="specializations.length === 0"
          class="p-2 text-sm text-muted-foreground text-center"
        >
          Brak dostępnych specjalizacji
        </div>

        <template v-else>
          <DropdownMenuCheckboxItem
            v-for="spec in specializations"
            :key="spec.id"
            :checked="modelValue.includes(spec.id)"
            @select.prevent="toggleSpecialization(spec.id)"
          >
            {{ spec.name }}
          </DropdownMenuCheckboxItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Selected Badges -->
    <div v-if="selectedCount > 0" class="flex flex-wrap gap-2">
      <Badge v-for="id in modelValue" :key="id" variant="secondary" class="px-2 py-1">
        {{ getSpecializationName(id) }}
        <button
          class="ml-2 hover:text-destructive focus:outline-none"
          @click.stop="toggleSpecialization(id)"
        >
          <X class="w-3 h-3" />
        </button>
      </Badge>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>
  </div>
</template>
