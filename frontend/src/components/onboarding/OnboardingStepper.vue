<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { cn } from "@/lib/utils";

interface Props {
  currentStep: number;
  steps: {
    id: number;
    label: string;
    description?: string;
  }[];
}

defineProps<Props>();
</script>

<template>
  <div class="w-full py-4">
    <div class="flex items-center justify-center space-x-4">
      <template v-for="(step, index) in steps" :key="step.id">
        <div class="flex items-center">
          <div
            :class="
              cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200',
                step.id < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.id === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground text-muted-foreground'
              )
            "
          >
            <Check v-if="step.id < currentStep" class="w-4 h-4" />
            <span v-else class="text-sm font-medium">{{ step.id }}</span>
          </div>
          <div class="ml-2 hidden sm:block">
            <p
              :class="
                cn(
                  'text-sm font-medium',
                  step.id === currentStep ? 'text-primary' : 'text-muted-foreground'
                )
              "
            >
              {{ step.label }}
            </p>
          </div>
        </div>
        <div v-if="index < steps.length - 1" class="w-12 h-0.5 mx-2 bg-muted hidden sm:block" />
      </template>
    </div>
  </div>
</template>
