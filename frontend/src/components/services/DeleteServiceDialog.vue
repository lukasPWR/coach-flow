<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  isDeleting?: boolean
  serviceName?: string
}

withDefaults(defineProps<Props>(), {
  isDeleting: false,
  serviceName: 'tę usługę',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

function handleOpenChange(open: boolean) {
  if (!open) {
    handleCancel()
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Czy na pewno chcesz usunąć usługę?</DialogTitle>
        <DialogDescription>
          Ta akcja jest nieodwracalna. Usługa "{{ serviceName }}" zostanie trwale usunięta z Twojej
          oferty.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" :disabled="isDeleting" @click="handleCancel">
          Anuluj
        </Button>
        <Button type="button" variant="destructive" :disabled="isDeleting" @click="handleConfirm">
          {{ isDeleting ? 'Usuwanie...' : 'Usuń' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
