<script setup lang="ts">
import { useOnboarding } from "@/composables/useOnboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Loader2 } from "lucide-vue-next";

const { state, specializations } = useOnboarding();

const toggleSpecialization = (id: string) => {
  const index = state.profileData.specializationIds.indexOf(id);
  if (index === -1) {
    state.profileData.specializationIds.push(id);
  } else {
    state.profileData.specializationIds.splice(index, 1);
  }
};

const getSpecializationName = (id: string) => {
  return specializations.value.find((s) => s.id === id)?.name || id;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Profile Picture URL -->
    <div class="space-y-2">
      <Label for="avatarUrl">URL Zdjęcia Profilowego</Label>
      <Input
        id="avatarUrl"
        v-model="state.profileData.profilePictureUrl"
        placeholder="https://example.com/photo.jpg"
      />
      <p class="text-xs text-muted-foreground">Wklej bezpośredni link do swojego zdjęcia.</p>
    </div>

    <!-- City -->
    <div class="space-y-2">
      <Label for="city">Miasto <span class="text-destructive">*</span></Label>
      <Input id="city" v-model="state.profileData.city" placeholder="np. Warszawa" />
    </div>

    <!-- Specializations (Multi-select) -->
    <div class="space-y-2">
      <Label>Specjalizacje <span class="text-destructive">*</span></Label>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="w-full justify-between">
            {{
              state.profileData.specializationIds.length > 0
                ? `Wybrano: ${state.profileData.specializationIds.length}`
                : "Wybierz specjalizacje"
            }}
            <ChevronDown class="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-full min-w-[300px] max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel>Dostępne specjalizacje</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div v-if="state.isLoading" class="flex justify-center p-4">
            <Loader2 class="w-4 h-4 animate-spin" />
          </div>

          <div
            v-else-if="specializations.length === 0"
            class="p-2 text-sm text-muted-foreground text-center"
          >
            Brak dostępnych specjalizacji
          </div>
          <template v-else>
            <!-- Using @select.prevent to keep menu open on selection and handling toggle manually -->
            <DropdownMenuCheckboxItem
              v-for="spec in specializations"
              :key="spec.id"
              :checked="state.profileData.specializationIds.includes(spec.id)"
              @select.prevent="toggleSpecialization(spec.id)"
            >
              {{ spec.name }}
            </DropdownMenuCheckboxItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Selected Badges -->
      <div class="flex flex-wrap gap-2 mt-2">
        <Badge
          v-for="id in state.profileData.specializationIds"
          :key="id"
          variant="secondary"
          class="px-2 py-1"
        >
          {{ getSpecializationName(id) }}
          <button
            class="ml-2 hover:text-destructive focus:outline-none"
            @click.stop="toggleSpecialization(id)"
          >
            <X class="w-3 h-3" />
          </button>
        </Badge>
      </div>
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <Label for="description">O mnie <span class="text-destructive">*</span></Label>
      <Textarea
        id="description"
        v-model="state.profileData.description"
        placeholder="Napisz kilka słów o sobie, swoim doświadczeniu i podejściu do treningu..."
        rows="5"
      />
    </div>
  </div>
</template>
