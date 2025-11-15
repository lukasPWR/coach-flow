<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

interface FormErrors {
  password?: string
  confirmPassword?: string
  general?: string
}

const route = useRoute()

const formData = reactive<ResetPasswordFormData>({
  password: '',
  confirmPassword: '',
})

const errors = ref<FormErrors>({})
const isLoading = ref(false)
const isSuccess = ref(false)
const token = ref<string | null>(null)

onMounted(() => {
  // Extract token from URL query parameter
  token.value = route.query.token as string || null
  
  if (!token.value) {
    errors.value.general = 'Nieprawidłowy lub brakujący token resetowania hasła.'
  }
})

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  // Password validation
  if (!formData.password) {
    newErrors.password = 'Pole jest wymagane.'
  } else if (formData.password.length < 8) {
    newErrors.password = 'Hasło musi mieć co najmniej 8 znaków.'
  }

  // Confirm password validation
  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Pole jest wymagane.'
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Hasła nie są identyczne.'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!token.value) {
    errors.value.general = 'Nieprawidłowy token resetowania hasła.'
    return
  }

  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.value = {}

  try {
    // TODO: Call API endpoint for password reset when implemented
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
    
    isSuccess.value = true
    console.log('Password reset successful with token:', token.value)
  } catch (error: any) {
    // Handle API errors
    if (error.response?.status === 400) {
      errors.value.general = 'Token resetowania hasła jest nieprawidłowy lub wygasł.'
    } else {
      errors.value.general = 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.'
    }
  } finally {
    isLoading.value = false
  }
}

const clearError = (field: keyof FormErrors) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight">Ustaw nowe hasło</h2>
      <p class="text-sm text-muted-foreground">
        Wprowadź nowe hasło dla swojego konta
      </p>
    </div>

    <!-- Success message -->
    <Alert v-if="isSuccess" class="border-green-500 bg-green-50 dark:bg-green-950">
      <CheckCircle2 class="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription class="text-green-800 dark:text-green-200">
        Hasło zostało pomyślnie zmienione. Możesz teraz zalogować się używając nowego hasła.
      </AlertDescription>
    </Alert>

    <!-- General error alert -->
    <Alert v-if="errors.general" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ errors.general }}</AlertDescription>
    </Alert>

    <form v-if="!isSuccess && token" @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Password field -->
      <div class="space-y-2">
        <Label for="password">Nowe hasło</Label>
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

      <!-- Confirm password field -->
      <div class="space-y-2">
        <Label for="confirmPassword">Potwierdź nowe hasło</Label>
        <Input
          id="confirmPassword"
          v-model="formData.confirmPassword"
          type="password"
          placeholder="••••••••"
          :class="{ 'border-destructive': errors.confirmPassword }"
          @input="clearError('confirmPassword')"
        />
        <p v-if="errors.confirmPassword" class="text-sm text-destructive">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <!-- Submit button -->
      <Button type="submit" class="w-full" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? 'Resetowanie...' : 'Zresetuj hasło' }}
      </Button>
    </form>

    <!-- Login link -->
    <div v-if="isSuccess" class="text-center">
      <a href="/login" class="text-primary hover:underline">
        Przejdź do logowania
      </a>
    </div>
  </div>
</template>

