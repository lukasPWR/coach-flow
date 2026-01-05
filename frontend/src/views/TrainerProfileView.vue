<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainerProfile } from '@/composables/useTrainerProfile'
import TrainerHeader from '@/components/trainers/profile/TrainerHeader.vue'
import TrainerBio from '@/components/trainers/profile/TrainerBio.vue'
import TrainerServicesList from '@/components/trainers/profile/TrainerServicesList.vue'
import TrainerAvailabilityWidget from '@/components/trainers/profile/TrainerAvailabilityWidget.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const route = useRoute()
const trainerId = route.params.id as string

const { trainer, isLoading, error, loadTrainer } = useTrainerProfile(trainerId)

onMounted(() => {
  loadTrainer()
})
</script>

<template>
  <div class="container py-8 md:py-12">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-8">
      <div class="flex flex-col gap-6 md:flex-row md:gap-8">
        <Skeleton class="h-32 w-32 rounded-full md:h-40 md:w-40" />
        <div class="flex-1 space-y-4">
          <Skeleton class="h-8 w-64" />
          <Skeleton class="h-4 w-32" />
          <div class="flex gap-2">
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-6 w-20" />
          </div>
        </div>
      </div>
      <div class="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div class="space-y-8">
          <Skeleton class="h-40 w-full" />
          <Skeleton class="h-60 w-full" />
        </div>
        <Skeleton class="h-[400px] w-full" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Alert variant="destructive" class="max-w-md">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Błąd</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <Button variant="outline" @click="$router.push({ name: 'trainers-list' })">
        Wróć do listy trenerów
      </Button>
    </div>

    <!-- Trainer Profile -->
    <div v-else-if="trainer" class="space-y-8">
      <TrainerHeader :trainer="trainer" />

      <div class="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div class="space-y-12">
          <TrainerBio v-if="trainer.description" :description="trainer.description" />
          <TrainerServicesList :services="trainer.services" />
        </div>

        <aside class="space-y-6">
          <TrainerAvailabilityWidget :trainer-id="trainer.id" />
        </aside>
      </div>
    </div>
  </div>
</template>
