<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

type UserRole = 'TRAINER' | 'USER'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  termsAccepted: boolean
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  termsAccepted?: string
  general?: string
}

const formData = reactive<RegisterFormData>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'USER',
  termsAccepted: false,
})

const errors = ref<FormErrors>({})
const isLoading = ref(false)

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}

  // Name validation
  if (!formData.name.trim()) {
    newErrors.name = 'Pole jest wymagane.'
  } else if (formData.name.trim().length < 2) {
    newErrors.name = 'Imię musi mieć co najmniej 2 znaki.'
  }

  // Email validation
  if (!formData.email.trim()) {
    newErrors.email = 'Pole jest wymagane.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Proszę podać poprawny adres e-mail.'
  }

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

  // Terms acceptance validation
  if (!formData.termsAccepted) {
    newErrors.termsAccepted = 'Musisz zaakceptować regulamin.'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.value = {}

  try {
    // TODO: Call authStore.register() when implemented
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
    
    // Placeholder for success handling
    console.log('Registration successful:', {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    })
  } catch (error: any) {
    // Handle API errors
    if (error.response?.status === 409) {
      errors.value.general = 'Adres e-mail jest już zajęty.'
    } else {
      errors.value.general = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.'
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
      <h2 class="text-2xl font-bold tracking-tight">Utwórz konto</h2>
      <p class="text-sm text-muted-foreground">
        Wypełnij formularz, aby rozpocząć korzystanie z CoachFlow
      </p>
    </div>

    <!-- General error alert -->
    <Alert v-if="errors.general" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ errors.general }}</AlertDescription>
    </Alert>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name field -->
      <div class="space-y-2">
        <Label for="name">Imię</Label>
        <Input
          id="name"
          v-model="formData.name"
          type="text"
          placeholder="Jan Kowalski"
          :class="{ 'border-destructive': errors.name }"
          @input="clearError('name')"
        />
        <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
      </div>

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
        <Label for="password">Hasło</Label>
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
        <Label for="confirmPassword">Potwierdź hasło</Label>
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

      <!-- Role selection -->
      <div class="space-y-3">
        <Label>Wybierz typ konta</Label>
        <RadioGroup v-model="formData.role">
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="role-user" value="USER" />
            <Label for="role-user" class="font-normal cursor-pointer">
              Użytkownik (Klient)
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="role-trainer" value="TRAINER" />
            <Label for="role-trainer" class="font-normal cursor-pointer">
              Trener
            </Label>
          </div>
        </RadioGroup>
      </div>

      <!-- Terms acceptance -->
      <div class="space-y-2">
        <div class="flex items-start space-x-2">
          <Checkbox
            id="terms"
            :checked="formData.termsAccepted"
            @update:checked="(checked) => {
              formData.termsAccepted = checked as boolean
              clearError('termsAccepted')
            }"
            :class="{ 'border-destructive': errors.termsAccepted }"
          />
          <Label for="terms" class="text-sm font-normal leading-none cursor-pointer">
            Akceptuję
            <a href="#" class="text-primary hover:underline">regulamin</a>
            oraz
            <a href="#" class="text-primary hover:underline">politykę prywatności</a>
          </Label>
        </div>
        <p v-if="errors.termsAccepted" class="text-sm text-destructive">
          {{ errors.termsAccepted }}
        </p>
      </div>

      <!-- Submit button -->
      <Button type="submit" class="w-full" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isLoading ? 'Rejestracja...' : 'Zarejestruj się' }}
      </Button>
    </form>

    <!-- Login link -->
    <div class="text-center text-sm">
      <span class="text-muted-foreground">Masz już konto?</span>
      <a href="/login" class="text-primary hover:underline ml-1">Zaloguj się</a>
    </div>
  </div>
</template>

