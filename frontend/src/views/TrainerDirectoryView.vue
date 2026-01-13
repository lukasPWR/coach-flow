<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTrainers } from "@/composables/useTrainers";
import { useAuthStore } from "@/stores/auth";
import TrainerCard from "@/components/trainers/TrainerCard.vue";
import TrainerCardSkeleton from "@/components/trainers/TrainerCardSkeleton.vue";
import TrainerFiltersSidebar from "@/components/trainers/TrainerFiltersSidebar.vue";
import InfiniteScrollTrigger from "@/components/trainers/InfiniteScrollTrigger.vue";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const goToDashboard = () => {
  if (authStore.isTrainer) {
    router.push("/trainer/dashboard");
  } else {
    router.push("/dashboard");
  }
};

// Use trainers composable
const {
  trainers,
  availableSpecializations,
  isLoading,
  isFetchingMore,
  error,
  filters,
  pagination,
  hasMore,
  isEmpty,
  fetchTrainers,
  loadMore,
  clearFilters,
  retry,
  fetchSpecializations,
} = useTrainers();

// Mobile filter sheet state
const isFilterSheetOpen = ref(false);

// Handle filter updates
function handleCityUpdate(value: string) {
  filters.city = value;
}

function handleSpecializationUpdate(value: string | null) {
  filters.specializationId = value;
}

function handleClearFilters() {
  clearFilters();
  isFilterSheetOpen.value = false;
}

// Initialize data on mount
onMounted(async () => {
  await Promise.all([fetchTrainers(true), fetchSpecializations()]);
});
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Top Navigation Bar -->
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
              <router-link to="/login"> Zaloguj się </router-link>
            </Button>
            <Button size="sm" as-child>
              <router-link to="/register"> Zarejestruj się </router-link>
            </Button>
          </template>
        </div>
      </div>
    </header>

    <!-- Header -->
    <div class="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Katalog Trenerów</h1>
            <p class="text-muted-foreground mt-1">Znajdź idealnego trenera dla siebie</p>
          </div>

          <!-- Mobile filter trigger -->
          <Sheet v-model:open="isFilterSheetOpen">
            <SheetTrigger as-child>
              <Button variant="outline" class="lg:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-2"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtry
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtry wyszukiwania</SheetTitle>
              </SheetHeader>
              <div class="mt-6">
                <TrainerFiltersSidebar
                  :available-specializations="availableSpecializations"
                  :current-filters="filters"
                  @update:city="handleCityUpdate"
                  @update:specialization-id="handleSpecializationUpdate"
                  @clear="handleClearFilters"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Desktop sidebar filters -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="sticky top-8">
            <TrainerFiltersSidebar
              :available-specializations="availableSpecializations"
              :current-filters="filters"
              @update:city="handleCityUpdate"
              @update:specialization-id="handleSpecializationUpdate"
              @clear="clearFilters"
            />
          </div>
        </aside>

        <!-- Trainers list section -->
        <main class="flex-1 min-w-0">
          <!-- Error state -->
          <Alert v-if="error" variant="destructive" class="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription class="flex items-center justify-between">
              <span>{{ error }}</span>
              <Button variant="outline" size="sm" @click="retry"> Spróbuj ponownie </Button>
            </AlertDescription>
          </Alert>

          <!-- Loading skeleton (initial load) -->
          <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <TrainerCardSkeleton v-for="i in 6" :key="i" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="isEmpty"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-muted-foreground mb-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 class="text-xl font-semibold mb-2">Nie znaleziono trenerów</h3>
            <p class="text-muted-foreground mb-4">Spróbuj zmienić kryteria wyszukiwania</p>
            <Button variant="outline" @click="clearFilters"> Wyczyść filtry </Button>
          </div>

          <!-- Trainers grid -->
          <div v-else>
            <!-- Results count -->
            <div class="mb-6 text-sm text-muted-foreground">
              Znaleziono {{ trainers.length }} z {{ pagination.total }} trenerów
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <TrainerCard v-for="trainer in trainers" :key="trainer.id" :trainer="trainer" />
            </div>

            <!-- Infinite scroll trigger -->
            <InfiniteScrollTrigger
              v-if="!isLoading"
              :enabled="hasMore && !isFetchingMore"
              @load-more="loadMore"
            />

            <!-- Loading more indicator -->
            <div
              v-if="isFetchingMore"
              class="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <TrainerCardSkeleton v-for="i in 3" :key="`loading-${i}`" />
            </div>

            <!-- End of list message -->
            <div
              v-if="!hasMore && trainers.length > 0"
              class="text-center py-8 text-muted-foreground"
            >
              To wszystkie dostępne wyniki
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
