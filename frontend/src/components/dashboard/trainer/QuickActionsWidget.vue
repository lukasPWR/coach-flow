<script setup lang="ts">
import ActionCard from './ActionCard.vue'

const quickActions = [
  {
    id: 'calendar',
    title: 'Kalendarz',
    description: 'Zarządzaj swoją dostępnością i harmonogramem',
    icon: '📅',
    route: '/calendar',
    color: 'primary' as const,
  },
  {
    id: 'services',
    title: 'Usługi',
    description: 'Edytuj ofertę i cennik swoich usług',
    icon: '💪',
    route: '/trainer/services',
    color: 'success' as const,
  },
  {
    id: 'profile',
    title: 'Profil',
    description: 'Zaktualizuj swój profil i zdjęcie',
    icon: '👤',
    route: '/profile',
    color: 'default' as const,
  },
  {
    id: 'bookings',
    title: 'Rezerwacje',
    description: 'Zobacz historię wszystkich rezerwacji',
    icon: '📋',
    route: '/my-bookings',
    color: 'warning' as const,
  },
]
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold flex items-center gap-2">
      <svg
        class="w-5 h-5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      Szybkie akcje
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ActionCard
        v-for="action in quickActions"
        :key="action.id"
        :title="action.title"
        :description="action.description"
        :icon="action.icon"
        :to="action.route"
        :color="action.color"
      />
    </div>
  </div>
</template>
