<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { Plus } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useServices } from "@/composables/useServices";
import { useServiceTypes } from "@/composables/useServiceTypes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServiceFormDialog, DeleteServiceDialog, ServicesList } from "@/components/services";
import type { Service, ServiceFormValues } from "@/types/services";

const authStore = useAuthStore();
const router = useRouter();

// Composables
const {
  services,
  isLoading: isLoadingServices,
  fetchServices,
  createService,
  updateService,
  deleteService,
} = useServices();
const {
  serviceTypes,
  serviceTypesMap,
  isLoading: isLoadingTypes,
  fetchServiceTypes,
} = useServiceTypes();

// Local state
const isFormDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const serviceToEdit = ref<Service | null>(null);
const serviceToDelete = ref<Service | null>(null);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const error = ref<string | null>(null);

// Toast notification state
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

// Computed
const isLoading = computed(() => isLoadingServices.value || isLoadingTypes.value);

// Functions
function showNotification(type: "success" | "error", message: string) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  notification.value = { show: true, type, message };
  notificationTimeout = setTimeout(() => {
    notification.value.show = false;
  }, 4000);
}

async function loadData() {
  try {
    error.value = null;
    await Promise.all([fetchServices(), fetchServiceTypes()]);
  } catch (err: any) {
    error.value = err.message || "Nie udało się pobrać danych";
    console.error("Failed to load data:", err);
  }
}

function handleAddService() {
  serviceToEdit.value = null;
  isFormDialogOpen.value = true;
}

function handleEditService(service: Service) {
  serviceToEdit.value = service;
  isFormDialogOpen.value = true;
}

function handleDeleteService(service: Service) {
  serviceToDelete.value = service;
  isDeleteDialogOpen.value = true;
}

async function handleFormSubmit(formData: ServiceFormValues) {
  try {
    isSubmitting.value = true;

    if (serviceToEdit.value) {
      // Edit mode
      await updateService(serviceToEdit.value.id, {
        price: formData.price,
        durationMinutes: formData.durationMinutes,
      });
      showNotification("success", "Usługa została zaktualizowana");
    } else {
      // Create mode
      await createService(formData);
      showNotification("success", "Usługa została dodana");
    }

    isFormDialogOpen.value = false;
    serviceToEdit.value = null;
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || "Nie udało się zapisać usługi";
    showNotification("error", Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleConfirmDelete() {
  if (!serviceToDelete.value) return;

  try {
    isDeleting.value = true;
    await deleteService(serviceToDelete.value.id);
    showNotification("success", "Usługa została usunięta");
    isDeleteDialogOpen.value = false;
    serviceToDelete.value = null;
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || "Nie udało się usunąć usługi";
    showNotification("error", Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
  } finally {
    isDeleting.value = false;
  }
}

function handleCancelDelete() {
  isDeleteDialogOpen.value = false;
  serviceToDelete.value = null;
}

function handleLogout() {
  authStore.logout();
  router.push("/login");
}

function retry() {
  loadData();
}

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-background via-background to-muted/30">
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

    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Zarządzanie Usługami</h1>
          <p class="text-muted-foreground mt-1">
            Definiuj swoją ofertę treningową i zarządzaj cenami
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline"
size="sm" @click="() => router.push('/trainer/dashboard')">
            Dashboard
          </Button>
          <Button
variant="outline" size="sm" @click="handleLogout"> Wyloguj się </Button>
        </div>
      </div>

      <!-- Error state -->
      <Alert v-if="error && !isLoading"
variant="destructive" class="mb-6">
        <svg class="w-4 h-4"
fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <AlertTitle>Wystąpił błąd</AlertTitle>
        <AlertDescription class="flex items-center justify-between">
          <span>{{ error }}</span>
          <Button
variant="outline" size="sm" @click="retry"> Spróbuj ponownie </Button>
        </AlertDescription>
      </Alert>

      <!-- Add Service Button -->
      <div class="mb-6">
        <Button :disabled="isLoading"
@click="handleAddService">
          <Plus class="h-4 w-4 mr-2" />
          Dodaj usługę
        </Button>
      </div>

      <!-- Services List -->
      <ServicesList
        :services="services"
        :service-types-map="serviceTypesMap"
        :is-loading="isLoading"
        @edit="handleEditService"
        @delete="handleDeleteService"
      >
        <template #empty-action>
          <Button @click="handleAddService">
            <Plus class="h-4 w-4 mr-2" />
            Dodaj pierwszą usługę
          </Button>
        </template>
      </ServicesList>

      <!-- Service Form Dialog -->
      <ServiceFormDialog
        v-model:open="isFormDialogOpen"
        :service-to-edit="serviceToEdit"
        :service-types="serviceTypes"
        :is-submitting="isSubmitting"
        @submit="handleFormSubmit"
      />

      <!-- Delete Service Dialog -->
      <DeleteServiceDialog
        v-model:open="isDeleteDialogOpen"
        :is-deleting="isDeleting"
        :service-name="
          serviceToDelete ? serviceToDelete.serviceType?.name || 'tę usługę' : 'tę usługę'
        "
        @confirm="handleConfirmDelete"
        @cancel="handleCancelDelete"
      />
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
  transform: translateX(100%);
}
</style>
