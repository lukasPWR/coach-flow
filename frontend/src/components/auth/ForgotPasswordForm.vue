<script setup lang="ts">
import { ref, reactive } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-vue-next";

interface ForgotPasswordFormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

const formData = reactive<ForgotPasswordFormData>({
  email: "",
});

const errors = ref<FormErrors>({});
const isLoading = ref(false);
const isSuccess = ref(false);

const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  // Email validation
  if (!formData.email.trim()) {
    newErrors.email = "Pole jest wymagane.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = "Proszę podać poprawny adres e-mail.";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errors.value = {};

  try {
    // TODO: Call API endpoint for password reset when implemented
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    isSuccess.value = true;
    console.log("Password reset email sent to:", formData.email);
  } catch (_error: any) {
    // Handle API errors
    errors.value.general = "Wystąpił błąd podczas wysyłania e-maila. Spróbuj ponownie.";
  } finally {
    isLoading.value = false;
  }
};

const clearError = (field: keyof FormErrors) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight">Zapomniałeś hasła?</h2>
      <p class="text-sm text-muted-foreground">
        Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła
      </p>
    </div>

    <!-- Success message -->
    <Alert v-if="isSuccess"
class="border-green-500 bg-green-50 dark:bg-green-950">
      <CheckCircle2 class="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription class="text-green-800 dark:text-green-200">
        Link do resetowania hasła został wysłany na adres <strong>{{ formData.email }}</strong
        >. Sprawdź swoją skrzynkę pocztową.
      </AlertDescription>
    </Alert>

    <!-- General error alert -->
    <Alert v-if="errors.general"
variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ errors.general }}</AlertDescription>
    </Alert>

    <form v-if="!isSuccess"
@submit.prevent="handleSubmit" class="space-y-4">
      <!-- Email field -->
      <div class="space-y-2">
        <Label for="email">Adres e-mail</Label>
        <Input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="jan@example.com"
          :class="{ 'border-destructive': errors.email }"
          @input="clearError('email')"
        />
        <p v-if="errors.email"
class="text-sm text-destructive">
          {{ errors.email }}
        </p>
      </div>

      <!-- Submit button -->
      <Button type="submit"
class="w-full" :disabled="isLoading">
        <Loader2 v-if="isLoading"
class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? "Wysyłanie..." : "Wyślij link resetujący" }}
      </Button>
    </form>

    <!-- Back to login link -->
    <div class="text-center">
      <a href="/login"
class="inline-flex items-center text-sm text-primary hover:underline">
        <ArrowLeft class="mr-1 h-4 w-4" />
        Powrót do logowania
      </a>
    </div>
  </div>
</template>
