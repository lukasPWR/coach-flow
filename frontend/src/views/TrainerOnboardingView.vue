<script setup lang="ts">
import { onMounted } from "vue";
import { useOnboarding } from "@/composables/useOnboarding";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper.vue";
import StepProfile from "@/components/onboarding/StepProfile.vue";
import StepServices from "@/components/onboarding/StepServices.vue";
import StepAvailability from "@/components/onboarding/StepAvailability.vue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-vue-next";

const {
  state,
  fetchDictionaries,
  checkExistingProfile,
  nextStep,
  prevStep,
  isProfileStepValid,
  isServicesStepValid,
  submitProfileStep,
  finishOnboarding,
} = useOnboarding();

const steps = [
  { id: 1, label: "Profil", description: "Podstawowe informacje" },
  { id: 2, label: "Usługi", description: "Twoja oferta" },
  { id: 3, label: "Dostępność", description: "Godziny pracy" },
];

onMounted(async () => {
  await fetchDictionaries();
  await checkExistingProfile();
});

const handleNext = async () => {
  if (state.currentStep === 1) {
    await submitProfileStep();
  } else {
    nextStep();
  }
};
</script>

<template>
  <div class="container max-w-4xl py-10 space-y-8">
    <div class="space-y-2 text-center">
      <h1 class="text-3xl font-bold tracking-tight">Witaj w CoachFlow</h1>
      <p class="text-muted-foreground">Skonfiguruj swój profil trenera w 3 prostych krokach.</p>
    </div>

    <OnboardingStepper :current-step="state.currentStep" :steps="steps" />

    <Card class="mt-6">
      <CardHeader>
        <CardTitle>{{ steps[state.currentStep - 1].label }}</CardTitle>
        <CardDescription>{{ steps[state.currentStep - 1].description }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="state.isLoading" class="flex justify-center py-8">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
        </div>

        <div v-else>
          <StepProfile v-if="state.currentStep === 1" />
          <StepServices v-else-if="state.currentStep === 2" />
          <StepAvailability v-else-if="state.currentStep === 3" />
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-between mt-6">
      <Button
        variant="outline"
        :disabled="state.currentStep === 1 || state.isLoading"
        @click="prevStep"
      >
        Wstecz
      </Button>

      <Button
        v-if="state.currentStep < 3"
        :disabled="
          state.isLoading ||
          (state.currentStep === 1 && !isProfileStepValid) ||
          (state.currentStep === 2 && !isServicesStepValid)
        "
        @click="handleNext"
      >
        <span v-if="state.isLoading" class="mr-2"><Loader2 class="w-4 h-4 animate-spin" /></span>
        {{ state.currentStep === 1 ? "Zapisz i Dalej" : "Dalej" }}
      </Button>

      <Button v-else :disabled="state.isLoading" @click="finishOnboarding">
        Zakończ Onboarding
      </Button>
    </div>
  </div>
</template>
