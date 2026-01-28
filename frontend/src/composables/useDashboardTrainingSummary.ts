import { ref } from "vue";
import { getTrainingPlans } from "@/lib/api/trainingPlans";
import { PlanStatus, type TrainingPlanDTO } from "@/types/training-plans";
import type { DashboardNotificationDTO } from "@/types/dashboard";

export function useDashboardTrainingSummary() {
  const activePlan = ref<TrainingPlanDTO | null>(null);
  const notifications = ref<DashboardNotificationDTO[]>([]);
  const loading = ref(false);

  const loadTrainingSummary = async () => {
    loading.value = true;
    try {
      // Fetch active plans. We don't filter by clientId here because the API likely handles it based on auth context
      // or we rely on the backend to return plans for the current user.
      // Based on API signature: getTrainingPlans(status, clientId).
      // If we are the client, we probably don't pass clientId, or pass our own ID if available.
      // Usually backend handles "me" context.
      const plans = await getTrainingPlans(PlanStatus.ACTIVE);

      if (plans && plans.length > 0) {
        // Sort by updatedAt desc to get the latest
        const sortedPlans = [...plans].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        const latestPlan = sortedPlans[0];
        activePlan.value = latestPlan;

        // Check if plan is "new" (e.g. updated in last 3 days) to show notification
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const planDate = new Date(latestPlan.updatedAt);

        if (planDate > threeDaysAgo) {
          notifications.value = [
            {
              id: `new-plan-${latestPlan.id}`,
              type: "PLAN_ASSIGNED",
              title: "Aktywny plan treningowy",
              message: `Twój plan "${latestPlan.name}" jest gotowy do realizacji.`,
              date: latestPlan.updatedAt,
              link: `/client/plans/${latestPlan.id}`,
              isRead: false,
            },
          ];
        } else {
          notifications.value = [];
        }
      } else {
        activePlan.value = null;
        notifications.value = [];
      }
    } catch (error) {
      console.error("Failed to load training summary:", error);
      // Reset state on error
      activePlan.value = null;
      notifications.value = [];
    } finally {
      loading.value = false;
    }
  };

  return { activePlan, notifications, loading, loadTrainingSummary };
}
