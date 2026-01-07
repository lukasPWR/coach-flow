<script setup lang="ts">
import type { TrainerProfile } from '@/types/trainer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { computed } from 'vue'

const props = defineProps<{
  profile: TrainerProfile
}>()

const emit = defineEmits<{
  edit: []
}>()

// Calculate user initials from name
const userInitials = computed(() => {
  const name = props.profile.trainerName
  if (!name) {
    return '??'
  }
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})
</script>

<template>
  <div class="bg-card rounded-lg p-6 shadow-sm space-y-6">
    <!-- Header Section with Avatar and Basic Info -->
    <div class="flex items-start gap-6">
      <Avatar size="lg" class="h-24 w-24">
        <AvatarImage
          v-if="profile.profilePictureUrl"
          :src="profile.profilePictureUrl"
          :alt="profile.trainerName"
        />
        <AvatarFallback class="text-2xl">
          {{ userInitials }}
        </AvatarFallback>
      </Avatar>

      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-1">{{ profile.trainerName }}</h2>
        <p class="text-muted-foreground">{{ profile.email }}</p>
      </div>

      <Button @click="emit('edit')" variant="outline"> Edytuj profil </Button>
    </div>

    <!-- Details Section -->
    <div class="space-y-4 pt-4 border-t">
      <div>
        <label class="text-sm font-medium text-muted-foreground">Miasto</label>
        <p class="text-lg mt-1">
          {{ profile.city || 'Nie podano' }}
        </p>
      </div>

      <div>
        <label class="text-sm font-medium text-muted-foreground">Opis</label>
        <p class="text-lg mt-1 whitespace-pre-wrap">
          {{ profile.description || 'Brak opisu' }}
        </p>
      </div>

      <div>
        <label class="text-sm font-medium text-muted-foreground mb-2 block"> Specjalizacje </label>
        <div v-if="profile.specializations.length > 0" class="flex flex-wrap gap-2">
          <Badge v-for="spec in profile.specializations" :key="spec.id" variant="secondary">
            {{ spec.name }}
          </Badge>
        </div>
        <p v-else class="text-muted-foreground">Brak wybranych specjalizacji</p>
      </div>
    </div>
  </div>
</template>
