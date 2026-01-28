<script setup lang="ts">
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";

const router = useRouter();

const handleFindTrainer = (): void => {
  router.push("/trainers");
};

const handleBecomeTrainer = (): void => {
  router.push("/register?role=trainer");
};
</script>

<template>
  <section class="flex items-center justify-center px-6 py-24 md:py-40 lg:py-48">
    <div class="max-w-5xl text-center space-y-8">
      <h1
        class="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-foreground/95"
      >
        CoachFlow<br class="hidden sm:inline" >
        Twoje centrum zarządzania treningiem
      </h1>
      <p
        class="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed"
      >
        CoachFlow to nowoczesna platforma łącząca trenerów z klientami. Zarządzaj grafikiem,
        rezerwuj sesje i rozwijaj swoją karierę sportową w jednym miejscu.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <Button
          size="lg"
          class="h-12 px-8 text-base font-medium rounded-full shadow-sm hover:shadow-md transition-all duration-200"
          @click="handleFindTrainer"
        >
          Znajdź trenera
        </Button>
        <Button
          size="lg"
          variant="outline"
          class="h-12 px-8 text-base font-medium rounded-full border-2 hover:bg-accent/50 transition-all duration-200"
          @click="handleBecomeTrainer"
        >
          Zostań trenerem
        </Button>
      </div>
    </div>
  </section>
</template>
