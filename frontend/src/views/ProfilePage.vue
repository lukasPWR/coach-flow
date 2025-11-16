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
    <div class="max-w-2xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Mój Profil</h1>
        <Button @click="handleLogout" variant="outline">Wyloguj się</Button>
      </div>

      <div class="bg-card rounded-lg p-6 shadow-sm">
        <h2 class="text-xl font-semibold mb-6">Informacje o koncie</h2>
        
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Imię</label>
            <p class="text-lg">{{ authStore.user?.name }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Email</label>
            <p class="text-lg">{{ authStore.user?.email }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Rola</label>
            <p class="text-lg">{{ authStore.user?.role }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Data utworzenia</label>
            <p class="text-lg">{{ new Date(authStore.user?.createdAt || "").toLocaleDateString("pl-PL") }}</p>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t">
          <Button variant="outline" class="w-full">Edytuj profil</Button>
        </div>
      </div>
    </div>
  </div>
</template>

