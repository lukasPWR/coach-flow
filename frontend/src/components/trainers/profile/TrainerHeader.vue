<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-vue-next";
import type { TrainerProfileViewModel } from "@/types/trainer";

interface Props {
  trainer: TrainerProfileViewModel;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
    <Avatar class="h-32 w-32 shadow-sm md:h-40 md:w-40">
      <AvatarImage :src="trainer.profilePictureUrl" :alt="trainer.name" />
      <AvatarFallback class="text-2xl">
        {{ trainer.initials }}
      </AvatarFallback>
    </Avatar>

    <div class="flex-1 space-y-4 py-2">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
          {{ trainer.name }}
        </h1>
        <div class="flex items-center text-muted-foreground">
          <MapPin class="mr-1 h-4 w-4" />
          <span>{{ trainer.city }}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Badge v-for="spec in trainer.specializations" :key="spec.id" variant="secondary">
          {{ spec.name }}
        </Badge>
      </div>
    </div>
  </div>
</template>
