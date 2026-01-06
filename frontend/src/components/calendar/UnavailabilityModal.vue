<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UnavailabilityFormData, UnavailabilityModalMode } from '@/types/calendar'

interface Props {
  isOpen: boolean
  initialData: UnavailabilityFormData | null
  mode: UnavailabilityModalMode
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  save: [data: UnavailabilityFormData]
  delete: [id: string]
}>()

// Formularz
const formData = ref<UnavailabilityFormData>({
  startTime: '',
  endTime: '',
})

// Błędy walidacji
const errors = ref<{
  startTime?: string
  endTime?: string
  general?: string
}>({})

// Computed
const isEditMode = computed(() => props.mode === 'EDIT')
const dialogTitle = computed(() =>
  isEditMode.value ? 'Edytuj niedostępność' : 'Dodaj niedostępność',
)
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Zmień czas niedostępności lub usuń ją.'
    : 'Ustaw okres, w którym nie będziesz dostępny dla klientów.',
)

// Obserwuj zmiany initialData i aktualizuj formularz
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = {
        id: newData.id,
        startTime: newData.startTime,
        endTime: newData.endTime,
      }
    } else {
      formData.value = {
        startTime: '',
        endTime: '',
      }
    }
    errors.value = {}
  },
  { immediate: true },
)

// Walidacja formularza
function validate(): boolean {
  errors.value = {}

  if (!formData.value.startTime) {
    errors.value.startTime = 'Podaj datę i godzinę rozpoczęcia'
  }

  if (!formData.value.endTime) {
    errors.value.endTime = 'Podaj datę i godzinę zakończenia'
  }

  if (formData.value.startTime && formData.value.endTime) {
    const start = new Date(formData.value.startTime)
    const end = new Date(formData.value.endTime)

    if (end <= start) {
      errors.value.endTime = 'Data zakończenia musi być późniejsza niż rozpoczęcia'
    }
  }

  return Object.keys(errors.value).length === 0
}

// Obsługa zapisu
function handleSave() {
  if (!validate()) return

  emit('save', { ...formData.value })
}

// Obsługa usuwania
function handleDelete() {
  if (formData.value.id) {
    emit('delete', formData.value.id)
  }
}

// Obsługa zamknięcia
function handleClose() {
  emit('close')
}

// Obsługa zmiany stanu dialogu
function handleOpenChange(open: boolean) {
  if (!open) {
    handleClose()
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSave">
        <!-- Data i godzina rozpoczęcia -->
        <div class="space-y-2">
          <Label for="startTime">Rozpoczęcie</Label>
          <Input
            id="startTime"
            v-model="formData.startTime"
            type="datetime-local"
            :class="{ 'border-destructive': errors.startTime }"
            :disabled="isLoading"
          />
          <p v-if="errors.startTime" class="text-sm text-destructive">
            {{ errors.startTime }}
          </p>
        </div>

        <!-- Data i godzina zakończenia -->
        <div class="space-y-2">
          <Label for="endTime">Zakończenie</Label>
          <Input
            id="endTime"
            v-model="formData.endTime"
            type="datetime-local"
            :class="{ 'border-destructive': errors.endTime }"
            :disabled="isLoading"
          />
          <p v-if="errors.endTime" class="text-sm text-destructive">
            {{ errors.endTime }}
          </p>
        </div>

        <!-- Błąd ogólny -->
        <p v-if="errors.general" class="text-sm text-destructive">
          {{ errors.general }}
        </p>
      </form>

      <DialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <!-- Przycisk usuwania (tylko w trybie edycji) -->
        <Button
          v-if="isEditMode"
          type="button"
          variant="destructive"
          :disabled="isLoading"
          @click="handleDelete"
        >
          Usuń
        </Button>

        <div class="flex gap-2">
          <Button type="button" variant="outline" :disabled="isLoading" @click="handleClose">
            Anuluj
          </Button>
          <Button type="submit" :disabled="isLoading" @click="handleSave">
            {{ isLoading ? 'Zapisywanie...' : 'Zapisz' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
