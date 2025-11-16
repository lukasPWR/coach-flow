import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/lib/api/auth'
import type { User, LoginRequest, RegisterRequest } from '@/lib/api/types'
import { apiClient } from '@/lib/api/client'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role)
  const isClient = computed(() => user.value?.role === 'CLIENT')
  const isTrainer = computed(() => user.value?.role === 'TRAINER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // Actions
  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      return response
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Wystąpił błąd podczas logowania. Spróbuj ponownie.'
      error.value = Array.isArray(message) ? message[0] : message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(data)
      user.value = response.user
      return response
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.'
      error.value = Array.isArray(message) ? message[0] : message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await authApi.logout()
    } catch (err: any) {
      console.error('Logout error:', err)
      // Continue with local logout even if API call fails
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!authApi.isAuthenticated()) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.getProfile()
      user.value = response.user as User
    } catch (err: any) {
      console.error('Fetch profile error:', err)
      // If profile fetch fails, clear auth state
      user.value = null
      apiClient.clearTokens()
    } finally {
      isLoading.value = false
    }
  }

  async function requestPasswordReset(email: string) {
    isLoading.value = true
    error.value = null

    try {
      await authApi.requestPasswordReset({ email })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Wystąpił błąd. Spróbuj ponownie.'
      error.value = Array.isArray(message) ? message[0] : message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(token: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      await authApi.resetPassword({ token, password })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Wystąpił błąd. Spróbuj ponownie.'
      error.value = Array.isArray(message) ? message[0] : message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  // Initialize auth state on app load
  async function initialize() {
    if (authApi.isAuthenticated()) {
      await fetchProfile()
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    isClient,
    isTrainer,
    isAdmin,
    // Actions
    login,
    register,
    logout,
    fetchProfile,
    requestPasswordReset,
    resetPassword,
    clearError,
    initialize,
  }
})
