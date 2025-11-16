<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push("/login");
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Dashboard Trenera</h1>
        <Button @click="handleLogout" variant="outline">Wyloguj się</Button>
      </div>

      <div class="bg-card rounded-lg p-6 shadow-sm mb-6">
        <h2 class="text-xl font-semibold mb-4">Witaj, {{ authStore.user?.name }}!</h2>
        <p class="text-muted-foreground">
          Email: {{ authStore.user?.email }}
        </p>
        <p class="text-muted-foreground">
          Rola: {{ authStore.user?.role }}
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="bg-card rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Moje Sesje</h3>
          <p class="text-muted-foreground">Zarządzaj swoimi sesjami treningowymi.</p>
        </div>

        <div class="bg-card rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Klienci</h3>
          <p class="text-muted-foreground">Zobacz listę swoich klientów.</p>
        </div>

        <div class="bg-card rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Kalendarz</h3>
          <p class="text-muted-foreground">Zarządzaj swoją dostępnością.</p>
        </div>

        <div class="bg-card rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Profil</h3>
          <p class="text-muted-foreground">Edytuj swój profil trenera.</p>
        </div>
      </div>
    </div>
  </div>
</template>

