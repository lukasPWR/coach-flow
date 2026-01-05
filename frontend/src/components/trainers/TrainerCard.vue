<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TrainerSummary } from '@/types/trainer'

interface Props {
  trainer: TrainerSummary
}

const props = defineProps<Props>()
const router = useRouter()

// Get initials for avatar fallback
const initials = computed(() => {
  const names = props.trainer.name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return props.trainer.name.substring(0, 2).toUpperCase()
})

// Navigate to trainer detail page
function viewTrainerDetails() {
  router.push({ name: 'trainer-profile', params: { id: props.trainer.id } })
}

// Truncate description to max length
const truncatedDescription = computed(() => {
  const maxLength = 120
  if (props.trainer.description.length > maxLength) {
    return props.trainer.description.substring(0, maxLength) + '...'
  }
  return props.trainer.description
})
</script>

<template>
  <Card
    class="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
    @click="viewTrainerDetails"
  >
    <CardHeader class="pb-3">
      <div class="flex items-start gap-4">
        <Avatar class="h-16 w-16 border-2 border-muted">
          <AvatarImage :src="trainer.profilePictureUrl" :alt="trainer.name" />
          <AvatarFallback class="text-lg">{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-xl group-hover:text-primary transition-colors">
            {{ trainer.name }}
          </CardTitle>
          <CardDescription class="flex items-center gap-1 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="inline-block"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {{ trainer.city }}
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent class="pb-3">
      <p class="text-sm text-muted-foreground line-clamp-3">
        {{ truncatedDescription }}
      </p>

      <div v-if="trainer.specializations.length > 0" class="flex flex-wrap gap-2 mt-3">
        <Badge
          v-for="specialization in trainer.specializations"
          :key="specialization.id"
          variant="secondary"
          class="text-xs"
        >
          {{ specialization.name }}
        </Badge>
      </div>
    </CardContent>

    <CardFooter>
      <Button
        variant="outline"
        class="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
      >
        Zobacz profil
      </Button>
    </CardFooter>
  </Card>
</template>
