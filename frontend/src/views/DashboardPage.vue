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
        <h1 class="text-3xl font-bold">Dashboard Klienta</h1>
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
          <h3 class="text-lg font-semibold mb-2">Moje Rezerwacje</h3>
          <p class="text-muted-foreground">Tutaj będą Twoje nadchodzące sesje treningowe.</p>
        </div>

        <div class="bg-card rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Znajdź Trenera</h3>
          <p class="text-muted-foreground">Przeglądaj dostępnych trenerów i umów się na trening.</p>
        </div>
      </div>
    </div>
  </div>
</template>

