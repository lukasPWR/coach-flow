<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import HeroSection from '@/components/views/home/HeroSection.vue'
import BenefitsSection from '@/components/views/home/BenefitsSection.vue'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const goToDashboard = () => {
  if (authStore.isTrainer) {
    router.push('/trainer/dashboard')
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Simple Header -->
    <header
      class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
      <div class="container flex h-16 items-center justify-between px-4">
        <router-link to="/" class="flex items-center gap-2 font-semibold">
          <span class="text-xl font-bold text-primary">CoachFlow</span>
        </router-link>

        <div class="flex items-center gap-2">
          <Button v-if="isAuthenticated" variant="default" size="sm" @click="goToDashboard">
            Dashboard
          </Button>
          <template v-else>
            <Button variant="ghost" size="sm" as-child>
              <router-link to="/login">Zaloguj się</router-link>
            </Button>
            <Button size="sm" as-child>
              <router-link to="/register">Zarejestruj się</router-link>
            </Button>
          </template>
        </div>
      </div>
    </header>

    <HeroSection />
    <BenefitsSection />
  </div>
</template>
