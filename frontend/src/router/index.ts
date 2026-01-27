import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomePage.vue"),
    },
    {
      path: "/trainers",
      name: "trainers-list",
      component: () => import("@/views/TrainerDirectoryView.vue"),
    },
    {
      path: "/trainer/:id",
      name: "trainer-profile",
      component: () => import("@/views/TrainerProfileView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterPage.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginPage.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/ForgotPasswordPage.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("@/views/ResetPasswordPage.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/dashboard/ClientDashboardView.vue"),
      meta: { requiresAuth: true, requiresRole: "CLIENT" },
    },
    {
      path: "/trainer/dashboard",
      name: "trainer-dashboard",
      component: () => import("@/views/TrainerDashboardPage.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("@/views/ProfilePage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/my-bookings",
      name: "my-bookings",
      component: () => import("@/views/MyBookingsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/onboarding",
      name: "trainer-onboarding",
      component: () => import("@/views/TrainerOnboardingView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/calendar",
      name: "trainer-calendar",
      component: () => import("@/views/trainer/CalendarView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/trainer/services",
      name: "trainer-services",
      component: () => import("@/views/trainer/ServicesView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/trainer/exercises",
      name: "trainer-exercises",
      component: () => import("@/views/trainer/ExerciseLibraryView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/trainer/plans",
      name: "trainer-plans",
      component: () => import("@/views/trainer/TrainingPlansView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/trainer/plans/:id/edit",
      name: "trainer-plan-edit",
      component: () => import("@/views/trainer/TrainingPlanBuilderView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
    {
      path: "/bookings",
      name: "trainer-bookings",
      component: () => import("@/views/trainer/BookingsView.vue"),
      meta: { requiresAuth: true, requiresRole: "TRAINER" },
    },
  ],
});

// Navigation guards
router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next) => {
  const authStore = useAuthStore();

  // Wait for auth store to initialize before checking auth state
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);
  const requiresRole = to.meta.requiresRole as string | undefined;

  // Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // Check if route requires guest (redirect authenticated users)
  if (requiresGuest && authStore.isAuthenticated) {
    if (authStore.isTrainer) {
      next({ name: "trainer-dashboard" });
    } else {
      next({ name: "dashboard" });
    }
    return;
  }

  // Check if route requires specific role
  if (requiresRole && authStore.userRole !== requiresRole) {
    next({ name: "home" });
    return;
  }

  // Trainer Onboarding Logic
  if (authStore.isTrainer && requiresAuth) {
    if (to.name === "trainer-onboarding") {
      // If trainer has profile, redirect to dashboard (skip onboarding)
      // Unless we want to allow re-visiting, but typically onboarding is once.
      if (authStore.hasTrainerProfile) {
        next({ name: "trainer-dashboard" });
        return;
      }
    } else {
      // If accessing other protected routes but profile is missing
      // Redirect to onboarding
      if (!authStore.hasTrainerProfile && to.name !== "trainer-onboarding" && to.name !== "login") {
        next({ name: "trainer-onboarding" });
        return;
      }
    }
  }

  next();
});

export default router;
