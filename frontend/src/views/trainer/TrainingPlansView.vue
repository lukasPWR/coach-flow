<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Plus, Search, Loader2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useTrainingPlans } from "@/composables/useTrainingPlans";
import PlanCard from "@/components/training-plans/PlanCard.vue";
import PlanStatusTabs from "@/components/training-plans/PlanStatusTabs.vue";
import CreatePlanModal from "@/components/training-plans/CreatePlanModal.vue";
import { PlanStatus, type CreatePlanForm } from "@/types/training-plans";

const router = useRouter();
const {
  plans,
  isLoading,
  filterStatus,
  fetchPlans,
  clients,
  isLoadingClients,
  fetchClients,
  createPlan,
} = useTrainingPlans();

const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);

onMounted(() => {
  fetchPlans();
});

const handleStatusChange = (status: PlanStatus) => {
  filterStatus.value = status;
  fetchPlans();
};

const openCreateModal = () => {
  isCreateModalOpen.value = true;
  if (clients.value.length === 0) {
    fetchClients();
  }
};

const handleCreatePlan = async (values: CreatePlanForm) => {
  isSubmitting.value = true;
  const success = await createPlan(values);
  isSubmitting.value = false;

  if (success) {
    isCreateModalOpen.value = false;
    // Optional: Redirect to the newly created plan
    // router.push({ name: 'training-plan-details', params: { id: createdPlan.id } });
  }
};

const navigateToPlan = (planId: string) => {
  router.push({ name: "trainer-plan-edit", params: { id: planId } });
};

// Simple client-side search filtering if needed, or just visual
// Currently API doesn't support search query for plans name, only status/clientId
// We could filter `plans` computed property locally if needed.
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Plany Treningowe</h1>
        <p class="text-muted-foreground">Zarządzaj planami treningowymi swoich podopiecznych.</p>
      </div>
      <Button @click="openCreateModal">
        <Plus class="mr-2 h-4 w-4" />
        Utwórz Plan
      </Button>
    </div>

    <!-- Filters & Tabs -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <PlanStatusTabs :model-value="filterStatus" @update:model-value="handleStatusChange" />
      <!-- Optional Search (Visual placeholder for future implementation) -->
      <!-- 
      <div class="relative w-full sm:w-[300px]">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Szukaj planów..."
          class="pl-8"
          v-model="searchQuery"
        />
      </div>
      -->
    </div>

    <!-- Content -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div
      v-else-if="plans.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed"
    >
      <div class="p-4 rounded-full bg-muted mb-4">
        <Search class="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium">Brak planów</h3>
      <p class="text-muted-foreground max-w-sm mt-1 mb-4">
        {{
          filterStatus === PlanStatus.ACTIVE
            ? "Nie masz żadnych aktywnych planów treningowych."
            : "Nie masz żadnych zarchiwizowanych planów."
        }}
      </p>
      <Button variant="outline" @click="openCreateModal" v-if="filterStatus === PlanStatus.ACTIVE">
        Utwórz swój pierwszy plan
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <PlanCard
        v-for="plan in plans"
        :key="plan.id"
        :plan="plan"
        @click="navigateToPlan(plan.id)"
      />
    </div>

    <!-- Modals -->
    <CreatePlanModal
      v-model:is-open="isCreateModalOpen"
      :is-loading-clients="isLoadingClients"
      :clients="clients"
      :is-submitting="isSubmitting"
      @submit="handleCreatePlan"
    />
  </div>
</template>
