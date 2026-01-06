<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTrainerDashboard } from '@/composables/useTrainerDashboard'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PendingRequestsWidget from '@/components/dashboard/trainer/PendingRequestsWidget.vue'
import DailyScheduleWidget from '@/components/dashboard/trainer/DailyScheduleWidget.vue'
import QuickActionsWidget from '@/components/dashboard/trainer/QuickActionsWidget.vue'

const authStore = useAuthStore()
const router = useRouter()

const {
  pendingBookings,
  todaysSessions,
  isLoading,
  isLoadingPending,
  isLoadingSchedule,
  error,
  trainerName,
  approveBooking,
  rejectBooking,
  isActionLoading,
  retry,
} = useTrainerDashboard()

// Toast-like notification state
const notification = ref<{
  show: boolean
  type: 'success' | 'error'
  message: string
}>({
  show: false,
  type: 'success',
  message: '',
})

let notificationTimeout: ReturnType<typeof setTimeout> | null = null

function showNotification(type: 'success' | 'error', message: string) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout)
  }
  notification.value = { show: true, type, message }
  notificationTimeout = setTimeout(() => {
    notification.value.show = false
  }, 4000)
}

async function handleApprove(id: string) {
  const result = await approveBooking(id)
  showNotification(result.success ? 'success' : 'error', result.message)
}

async function handleReject(id: string) {
  const result = await rejectBooking(id)
  showNotification(result.success ? 'success' : 'error', result.message)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-background via-background to-muted/30">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div
        v-if="notification.show"
        :class="[
          'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border',
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-destructive/10 border-destructive/20 text-destructive',
        ]"
      >
        <div class="flex items-center gap-3">
          <svg
            v-if="notification.type === 'success'"
            class="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm font-medium">{{ notification.message }}</span>
          <button
            class="ml-auto -mr-1 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            @click="notification.show = false"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Header with logout -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <DashboardHeader :user-name="trainerName" />
        <Button variant="outline" size="sm" @click="handleLogout">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Wyloguj się
        </Button>
      </div>

      <!-- Error state -->
      <Alert v-if="error && !isLoading" variant="destructive" class="mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <AlertTitle>Wystąpił błąd</AlertTitle>
        <AlertDescription class="flex items-center justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="retry"> Spróbuj ponownie </Button>
        </AlertDescription>
      </Alert>

      <!-- Main grid layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left column: Pending requests (takes more space) -->
        <div class="lg:col-span-7 xl:col-span-8">
          <PendingRequestsWidget
            :requests="pendingBookings"
            :is-loading="isLoadingPending || isLoading"
            :is-action-loading="isActionLoading"
            @approve="handleApprove"
            @reject="handleReject"
          />
        </div>

        <!-- Right column: Daily schedule -->
        <div class="lg:col-span-5 xl:col-span-4">
          <DailyScheduleWidget
            :sessions="todaysSessions"
            :is-loading="isLoadingSchedule || isLoading"
          />
        </div>

        <!-- Full width: Quick actions -->
        <div class="lg:col-span-12">
          <QuickActionsWidget />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
