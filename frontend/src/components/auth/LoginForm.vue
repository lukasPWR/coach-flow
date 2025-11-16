<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const router = useRouter();
const authStore = useAuthStore();

const formData = reactive<LoginFormData>({
  email: "",
  password: "",
});

const errors = ref<FormErrors>({});
const isLoading = ref(false);

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  // Email validation
  if (!formData.email.trim()) {
    newErrors.email = 'Pole jest wymagane.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Proszę podać poprawny adres e-mail.'
  }

  // Password validation
  if (!formData.password) {
    newErrors.password = 'Pole jest wymagane.'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errors.value = {};

  try {
    await authStore.login({
      email: formData.email,
      password: formData.password,
    });

    // Redirect based on user role
    if (authStore.isTrainer) {
      router.push("/trainer/dashboard");
    } else {
      router.push("/dashboard");
    }
  } catch (error: any) {
    // Handle API errors
    if (error.response?.status === 401) {
      errors.value.general = "Nieprawidłowy e-mail lub hasło.";
    } else if (error.response?.data?.message) {
      const message = error.response.data.message;
      errors.value.general = Array.isArray(message) ? message[0] : message;
    } else {
      errors.value.general = "Wystąpił błąd podczas logowania. Spróbuj ponownie.";
    }
  } finally {
    isLoading.value = false;
  }
};

const clearError = (field: keyof FormErrors) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight">Witaj ponownie</h2>
      <p class="text-sm text-muted-foreground">
        Zaloguj się do swojego konta CoachFlow
      </p>
    </div>

    <!-- General error alert -->
    <Alert v-if="errors.general" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ errors.general }}</AlertDescription>
    </Alert>

    <form @submit.prevent="handleSubmit" class="space-y-4">
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
        <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
      </div>

      <!-- Password field -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="password">Hasło</Label>
          <a
            href="/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            Zapomniałeś hasła?
          </a>
        </div>
        <Input
          id="password"
          v-model="formData.password"
          type="password"
          placeholder="••••••••"
          :class="{ 'border-destructive': errors.password }"
          @input="clearError('password')"
        />
        <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
      </div>

      <!-- Submit button -->
      <Button type="submit" class="w-full" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? 'Logowanie...' : 'Zaloguj się' }}
      </Button>
    </form>

    <!-- Register link -->
    <div class="text-center text-sm">
      <span class="text-muted-foreground">Nie masz jeszcze konta?</span>
      <a href="/register" class="text-primary hover:underline ml-1">Zarejestruj się</a>
    </div>
  </div>
</template>

