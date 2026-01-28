<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-vue-next";
import type { TrainerProfile, UpdateTrainerProfileDto } from "@/types/trainer";
import { getMyFullTrainerProfile, updateTrainerProfile } from "@/lib/api/trainers";
import TrainerProfileView from "@/components/profile/TrainerProfileView.vue";
import TrainerProfileForm from "@/components/profile/TrainerProfileForm.vue";

const authStore = useAuthStore();
const router = useRouter();

// State
const profile = ref<TrainerProfile | null>(null);
const isLoading = ref(false);
const isEditing = ref(false);
const error = ref<string | null>(null);

// Notification state
const notification = ref<{
  show: boolean;
  type: "success" | "error";
  message: string;
}>({
  show: false,
  type: "success",
  message: "",
});

let notificationTimeout: ReturnType<typeof setTimeout> | null = null;

function showNotification(type: "success" | "error", message: string) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  notification.value = { show: true, type, message };
  notificationTimeout = setTimeout(() => {
    notification.value.show = false;
  }, 4000);
}

// Load profile data
async function loadProfile() {
  isLoading.value = true;
  error.value = null;

  try {
    profile.value = await getMyFullTrainerProfile();
  } catch (err: any) {
    if (err.response?.status === 404) {
      error.value = "Nie znaleziono profilu trenera. Skontaktuj się z administratorem.";
    } else {
      error.value = "Nie udało się pobrać danych profilu. Spróbuj ponownie.";
    }
  } finally {
    isLoading.value = false;
  }
}

// Handle edit mode toggle
function handleEdit() {
  isEditing.value = true;
}

// Handle cancel edit
function handleCancel() {
  isEditing.value = false;
}

// Handle save profile
async function handleSave(data: UpdateTrainerProfileDto) {
  if (!profile.value) return;

  try {
    await updateTrainerProfile(profile.value.id, data);
    // Reload full profile to get all fields including trainerName and email
    await loadProfile();
    isEditing.value = false;

    showNotification("success", "Profil został zaktualizowany pomyślnie");
  } catch (err: any) {
    showNotification("error", err.response?.data?.message || "Nie udało się zapisać zmian");
  }
}

// Handle logout
async function handleLogout() {
  await authStore.logout();
  router.push("/login");
}

// Load profile on mount
onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div
        v-if="notification.show"
        :class="[
          'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border',
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-destructive/10 border-destructive/20 text-destructive',
        ]"
      >
        <div class="flex items-center gap-3">
          <svg
            v-if="notification.type === 'success'"
            class="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm font-medium">{{ notification.message }}</span>
          <button
            class="ml-auto -mr-1 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            @click="notification.show = false"
          >
            <svg class="w-4 h-4"
fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Mój Profil</h1>
        <Button
variant="outline" @click="handleLogout"> Wyloguj się </Button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading"
class="space-y-4">
        <Skeleton class="h-[200px] w-full rounded-lg" />
        <Skeleton class="h-[100px] w-full rounded-lg" />
      </div>

      <!-- Error state -->
      <Alert v-else-if="error"
variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Profile view/edit -->
      <template v-else-if="profile">
        <!-- View mode -->
        <TrainerProfileView v-if="!isEditing"
:profile="profile" @edit="handleEdit" />

        <!-- Edit mode -->
        <TrainerProfileForm
          v-else
          :initial-data="profile"
          @submit="handleSave"
          @cancel="handleCancel"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
