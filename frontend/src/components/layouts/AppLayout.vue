<template>
  <div class="min-h-screen bg-background">
    <!-- Header Navigation -->
    <header
      class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container flex h-16 items-center justify-between px-4">
        <!-- Logo and Brand -->
        <div class="flex items-center gap-6">
          <router-link to="/" class="flex items-center gap-2 font-semibold">
            <span class="text-xl font-bold text-primary">CoachFlow</span>
          </router-link>

          <!-- Navigation Links -->
          <nav v-if="isAuthenticated" class="hidden md:flex items-center gap-1">
            <Button v-if="isTrainer" variant="ghost" size="sm" as-child>
              <router-link to="/trainer/dashboard"> Dashboard </router-link>
            </Button>
            <Button v-if="isClient" variant="ghost" size="sm" as-child>
              <router-link to="/dashboard"> Dashboard </router-link>
            </Button>
            <Button v-if="isTrainer" variant="ghost" size="sm" as-child>
              <router-link to="/bookings"> Rezerwacje </router-link>
            </Button>
            <Button v-if="isClient" variant="ghost" size="sm" as-child>
              <router-link to="/my-bookings"> Moje rezerwacje </router-link>
            </Button>
            <Button v-if="isClient" variant="ghost" size="sm" as-child>
              <router-link to="/client/plans"> Moje plany </router-link>
            </Button>
            <Button v-if="isTrainer" variant="ghost" size="sm" as-child>
              <router-link to="/calendar"> Kalendarz </router-link>
            </Button>
            <Button v-if="isTrainer" variant="ghost" size="sm" as-child>
              <router-link to="/trainer/services"> Usługi </router-link>
            </Button>
            <Button variant="ghost" size="sm" as-child>
              <router-link to="/trainers"> Trenerzy </router-link>
            </Button>
          </nav>
        </div>

        <!-- User Menu -->
        <div v-if="isAuthenticated" class="flex items-center gap-2">
          <!-- User Info -->
          <div class="hidden sm:flex items-center gap-3 mr-2">
            <div class="text-right">
              <p class="text-sm font-medium leading-none">
                {{ user?.name || "Użytkownik" }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ roleLabel }}
              </p>
            </div>
            <Avatar>
              <AvatarImage
                v-if="user?.profilePictureUrl"
                :src="user.profilePictureUrl"
                :alt="user.name"
              />
              <AvatarFallback>{{ userInitials }}</AvatarFallback>
            </Avatar>
          </div>

          <!-- Logout Button -->
          <Button variant="outline" size="sm" :disabled="isLoggingOut" @click="handleLogout">
            <LogOut class="h-4 w-4 mr-2" />
            <span class="hidden sm:inline">Wyloguj</span>
          </Button>

          <!-- Mobile Menu Toggle -->
          <Sheet v-model:open="mobileMenuOpen">
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="md:hidden">
                <Menu class="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div class="flex flex-col gap-4 mt-6">
                <!-- User Info Mobile -->
                <div class="flex items-center gap-3 pb-4 border-b">
                  <Avatar>
                    <AvatarImage
                      v-if="user?.profilePictureUrl"
                      :src="user.profilePictureUrl"
                      :alt="user.name"
                    />
                    <AvatarFallback>{{ userInitials }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="text-sm font-medium">
                      {{ user?.name || "Użytkownik" }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ roleLabel }}
                    </p>
                  </div>
                </div>

                <!-- Navigation Links Mobile -->
                <nav class="flex flex-col gap-2">
                  <Button
                    v-if="isTrainer"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/trainer/dashboard"> Dashboard </router-link>
                  </Button>
                  <Button
                    v-if="isClient"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/dashboard"> Dashboard </router-link>
                  </Button>
                  <Button
                    v-if="isTrainer"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/bookings"> Rezerwacje </router-link>
                  </Button>
                  <Button
                    v-if="isClient"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/my-bookings"> Moje rezerwacje </router-link>
                  </Button>
                  <Button
                    v-if="isClient"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/client/plans"> Moje plany </router-link>
                  </Button>
                  <Button
                    v-if="isTrainer"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/calendar"> Kalendarz </router-link>
                  </Button>
                  <Button
                    v-if="isTrainer"
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/trainer/services"> Usługi </router-link>
                  </Button>
                  <Button
                    variant="ghost"
                    class="justify-start"
                    as-child
                    @click="mobileMenuOpen = false"
                  >
                    <router-link to="/trainers"> Trenerzy </router-link>
                  </Button>
                </nav>

                <!-- Logout Button Mobile -->
                <Button
                  variant="destructive"
                  class="mt-4"
                  :disabled="isLoggingOut"
                  @click="handleLogout"
                >
                  <LogOut class="h-4 w-4 mr-2" />
                  Wyloguj się
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <!-- Guest Actions -->
        <div v-else class="flex items-center gap-2">
          <Button variant="ghost" size="sm" as-child>
            <router-link to="/login"> Zaloguj się </router-link>
          </Button>
          <Button size="sm" as-child>
            <router-link to="/register"> Zarejestruj się </router-link>
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { LogOut, Menu } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const mobileMenuOpen = ref(false);
const isLoggingOut = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isTrainer = computed(() => authStore.isTrainer);
const isClient = computed(() => authStore.isClient);
const user = computed(() => authStore.user);

const roleLabel = computed(() => {
  if (authStore.isTrainer) return "Trener";
  if (authStore.isClient) return "Klient";
  return "";
});

const userInitials = computed(() => {
  if (!user.value?.name) return "U";
  return user.value.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const handleLogout = async () => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  try {
    await authStore.logout();
    // The logout action in store already redirects to home
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    isLoggingOut.value = false;
  }
};
</script>
