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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Service, ServiceType, ServiceFormValues } from '@/types/services'

interface Props {
  open: boolean
  serviceToEdit: Service | null
  serviceTypes: ServiceType[]
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [formData: ServiceFormValues]
}>()

// Form state
const formData = ref<ServiceFormValues>({
  serviceTypeId: '',
  price: 0,
  durationMinutes: 60, // Default 60 minutes for MVP
})

// Validation errors
const errors = ref<{
  serviceTypeId?: string
  price?: string
  durationMinutes?: string
  general?: string
}>({})

// Computed
const isEditMode = computed(() => props.serviceToEdit !== null)
const dialogTitle = computed(() => (isEditMode.value ? 'Edytuj usługę' : 'Dodaj usługę'))
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Zmień cenę usługi. Typ usługi nie może być zmieniony.'
    : 'Wybierz typ usługi i ustaw cenę.',
)

// Watch for changes in serviceToEdit prop
watch(
  () => props.serviceToEdit,
  (newService) => {
    if (newService) {
      // Edit mode - populate form with existing data
      // Note: /trainers/me doesn't return serviceTypeId, so we need to find it
      // by matching the service type name
      let serviceTypeId = newService.serviceTypeId || ''

      if (!serviceTypeId && newService.serviceType?.name) {
        // Find serviceTypeId by matching the name
        const matchingType = props.serviceTypes.find(
          (type) => type.name === newService.serviceType?.name,
        )
        if (matchingType) {
          serviceTypeId = matchingType.id
        }
      }

      formData.value = {
        serviceTypeId,
        price: newService.price,
        durationMinutes: newService.durationMinutes,
      }
    } else {
      // Create mode - reset form
      resetForm()
    }
    errors.value = {}
  },
  { immediate: true },
)

// Watch for dialog open state changes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm()
      errors.value = {}
    }
  },
)

// Form validation
function validate(): boolean {
  errors.value = {}

  if (!formData.value.serviceTypeId) {
    errors.value.serviceTypeId = 'Wybierz typ usługi'
  }

  if (formData.value.price === null || formData.value.price === undefined) {
    errors.value.price = 'Podaj cenę usługi'
  } else if (formData.value.price < 0) {
    errors.value.price = 'Cena nie może być ujemna'
  }

  if (formData.value.durationMinutes === null || formData.value.durationMinutes === undefined) {
    errors.value.durationMinutes = 'Podaj czas trwania'
  } else if (formData.value.durationMinutes < 15) {
    errors.value.durationMinutes = 'Czas trwania musi wynosić co najmniej 15 minut'
  } else if (formData.value.durationMinutes > 180) {
    errors.value.durationMinutes = 'Czas trwania nie może przekraczać 180 minut'
  } else if (formData.value.durationMinutes % 15 !== 0) {
    errors.value.durationMinutes = 'Czas trwania musi być wielokrotnością 15 minut'
  }

  return Object.keys(errors.value).length === 0
}

// Handle form submission
function handleSubmit() {
  if (!validate()) return

  emit('submit', { ...formData.value })
}

// Reset form to initial state
function resetForm() {
  formData.value = {
    serviceTypeId: '',
    price: 0,
    durationMinutes: 60,
  }
}

// Handle dialog close
function handleClose() {
  emit('update:open', false)
}

// Handle dialog open change
function handleOpenChange(open: boolean) {
  emit('update:open', open)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Service Type Selection -->
        <div class="space-y-2">
          <Label for="serviceTypeId">Typ usługi</Label>
          <Select v-model="formData.serviceTypeId" :disabled="isEditMode || isSubmitting">
            <SelectTrigger
              id="serviceTypeId"
              :class="{ 'border-destructive': errors.serviceTypeId }"
            >
              <SelectValue placeholder="Wybierz typ usługi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in serviceTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.serviceTypeId" class="text-sm text-destructive">
            {{ errors.serviceTypeId }}
          </p>
        </div>

        <!-- Price Input -->
        <div class="space-y-2">
          <Label for="price">Cena (PLN)</Label>
          <Input
            id="price"
            v-model.number="formData.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            :class="{ 'border-destructive': errors.price }"
            :disabled="isSubmitting"
          />
          <p v-if="errors.price" class="text-sm text-destructive">
            {{ errors.price }}
          </p>
        </div>

        <!-- Duration -->
        <div class="space-y-2">
          <Label for="duration">Czas trwania (minuty)</Label>
          <Input
            id="duration"
            v-model.number="formData.durationMinutes"
            type="number"
            min="15"
            max="180"
            step="15"
            placeholder="60"
            :class="{ 'border-destructive': errors.durationMinutes }"
            :disabled="isSubmitting"
          />
          <p v-if="errors.durationMinutes" class="text-sm text-destructive">
            {{ errors.durationMinutes }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            Czas trwania sesji (15-180 min, wielokrotność 15)
          </p>
        </div>

        <!-- General error -->
        <p v-if="errors.general" class="text-sm text-destructive">
          {{ errors.general }}
        </p>
      </form>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleClose">
          Anuluj
        </Button>
        <Button type="submit" :disabled="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? 'Zapisywanie...' : 'Zapisz' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
