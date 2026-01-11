<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppLayout from "@/components/layouts/AppLayout.vue";

const route = useRoute();
const authStore = useAuthStore();

// Routes that should not use AppLayout (auth pages and public pages with custom layout)
const noLayoutRoutes = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "home",
  "trainers-list",
  "trainer-profile",
];

const shouldUseLayout = computed(() => {
  return authStore.isAuthenticated && !noLayoutRoutes.includes(route.name as string);
});
</script>

<template>
  <AppLayout v-if="shouldUseLayout">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>
