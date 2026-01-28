<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { TrainerProfile, UpdateTrainerProfileDto, Specialization } from "@/types/trainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-vue-next";
import SpecializationSelect from "./SpecializationSelect.vue";
import { getAllSpecializations } from "@/lib/api/trainers";

interface Props {
  initialData: TrainerProfile;
}

interface FormData {
  description: string;
  city: string;
  profilePictureUrl: string;
  specializationIds: string[];
}

interface FormErrors {
  description?: string;
  city?: string;
  profilePictureUrl?: string;
  specializationIds?: string;
  general?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: UpdateTrainerProfileDto];
  cancel: [];
}>();

// Form state
const formData = ref<FormData>({
  description: "",
  city: "",
  profilePictureUrl: "",
  specializationIds: [],
});

const errors = ref<FormErrors>({});
const isSubmitting = ref(false);

// Specializations state
const specializations = ref<Specialization[]>([]);
const isLoadingSpecializations = ref(false);

// Initialize form with initial data
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = {
        description: newData.description || "",
        city: newData.city || "",
        profilePictureUrl: newData.profilePictureUrl || "",
        specializationIds: newData.specializations.map((s) => s.id),
      };
    }
  },
  { immediate: true }
);

// Load specializations on mount
onMounted(async () => {
  isLoadingSpecializations.value = true;
  try {
    specializations.value = await getAllSpecializations();
  } catch (_error: any) {
    errors.value.general = "Nie udało się pobrać listy specjalizacji";
  } finally {
    isLoadingSpecializations.value = false;
  }
});

// Validation
function validateForm(): boolean {
  errors.value = {};

  // Description validation (optional, max 500 chars)
  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = "Opis nie może przekraczać 500 znaków";
  }

  // City validation (optional)
  if (formData.value.city && formData.value.city.length > 100) {
    errors.value.city = "Nazwa miasta jest zbyt długa";
  }

  // Profile picture URL validation (optional, must be valid URL)
  if (formData.value.profilePictureUrl) {
    try {
      new URL(formData.value.profilePictureUrl);
    } catch {
      errors.value.profilePictureUrl = "Podaj poprawny adres URL";
    }
  }

  return Object.keys(errors.value).length === 0;
}

// Handle form submission
function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  // Prepare DTO - only include changed fields
  const dto: UpdateTrainerProfileDto = {};

  if (formData.value.description !== (props.initialData.description || "")) {
    dto.description = formData.value.description || undefined;
  }

  if (formData.value.city !== (props.initialData.city || "")) {
    dto.city = formData.value.city || undefined;
  }

  if (formData.value.profilePictureUrl !== (props.initialData.profilePictureUrl || "")) {
    dto.profilePictureUrl = formData.value.profilePictureUrl || undefined;
  }

  // Always include specializationIds if changed
  const initialIds = props.initialData.specializations.map((s) => s.id).sort();
  const currentIds = [...formData.value.specializationIds].sort();
  if (JSON.stringify(initialIds) !== JSON.stringify(currentIds)) {
    dto.specializationIds = formData.value.specializationIds;
  }

  emit("submit", dto);
}

// Handle cancel
function handleCancel() {
  errors.value = {};
  emit("cancel");
}

// Clear specific field error
function clearError(field: keyof FormErrors) {
  if (errors.value[field]) {
    delete errors.value[field];
  }
}
</script>

<template>
  <div class="bg-card rounded-lg p-6 shadow-sm">
    <h2 class="text-xl font-semibold mb-6">Edytuj profil</h2>

    <!-- General error alert -->
    <Alert v-if="errors.general"
variant="destructive" class="mb-6">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ errors.general }}</AlertDescription>
    </Alert>

    <form class="space-y-6"
@submit.prevent="handleSubmit">
      <!-- Profile Picture URL -->
      <div class="space-y-2">
        <Label for="profilePictureUrl">Zdjęcie profilowe (URL)</Label>
        <Input
          id="profilePictureUrl"
          v-model="formData.profilePictureUrl"
          type="text"
          placeholder="https://example.com/photo.jpg"
          :class="{ 'border-destructive': errors.profilePictureUrl }"
          @input="clearError('profilePictureUrl')"
        />
        <p class="text-xs text-muted-foreground">
          Wklej bezpośredni link do swojego zdjęcia profilowego
        </p>
        <p v-if="errors.profilePictureUrl"
class="text-sm text-destructive">
          {{ errors.profilePictureUrl }}
        </p>
      </div>

      <!-- City -->
      <div class="space-y-2">
        <Label for="city">Miasto</Label>
        <Input
          id="city"
          v-model="formData.city"
          type="text"
          placeholder="np. Warszawa"
          :class="{ 'border-destructive': errors.city }"
          @input="clearError('city')"
        />
        <p v-if="errors.city"
class="text-sm text-destructive">
          {{ errors.city }}
        </p>
      </div>

      <!-- Description -->
      <div class="space-y-2">
        <Label for="description">Opis</Label>
        <Textarea
          id="description"
          v-model="formData.description"
          placeholder="Napisz kilka słów o sobie, swoim doświadczeniu i podejściu do treningu..."
          rows="5"
          :class="{ 'border-destructive': errors.description }"
          @input="clearError('description')"
        />
        <p class="text-xs text-muted-foreground">{{ formData.description.length }} / 500 znaków</p>
        <p v-if="errors.description"
class="text-sm text-destructive">
          {{ errors.description }}
        </p>
      </div>

      <!-- Specializations -->
      <div class="space-y-2">
        <Label>Specjalizacje</Label>
        <SpecializationSelect
          v-model="formData.specializationIds"
          :specializations="specializations"
          :is-loading="isLoadingSpecializations"
          :error="errors.specializationIds"
        />
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 pt-4 border-t">
        <Button type="submit"
:disabled="isSubmitting" class="flex-1">
          <Loader2 v-if="isSubmitting"
class="mr-2 h-4 w-4 animate-spin" />
          {{ isSubmitting ? "Zapisywanie..." : "Zapisz zmiany" }}
        </Button>
        <Button
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          class="flex-1"
          @click="handleCancel"
        >
          Anuluj
        </Button>
      </div>
    </form>
  </div>
</template>
