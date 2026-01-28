/**
 * Typy ViewModel dla Trainer Dashboard
 */

/**
 * Reprezentacja oczekującej rezerwacji w UI
 */
export interface PendingBookingVM {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string; // ISO Date
  formattedDate: string; // np. "26.11.2025"
  formattedTime: string; // np. "10:00 - 11:00"
  createdAt: string; // Data utworzenia wniosku
  expiresAt: string; // createdAt + 24h
  isUrgent: boolean; // true jeśli do końca zostało < 2h
  isExpired: boolean; // true jeśli czas minął
  remainingTime: string; // np. "2h 15m" lub "Wygasło"
}

/**
 * Reprezentacja sesji w agendzie dziennej
 */
export interface DailySessionVM {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  timeRange: string; // np. "14:00 - 15:00"
  status: "ACCEPTED";
}

/**
 * Stan dashboardu trenera
 */
export interface TrainerDashboardState {
  pendingBookings: PendingBookingVM[];
  todaysSessions: DailySessionVM[];
  isLoading: boolean;
  isLoadingPending: boolean;
  isLoadingSchedule: boolean;
  error: string | null;
  trainerName: string;
}

/**
 * Akcje szybkiego dostępu
 */
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color?: string;
}

/**
 * Powiadomienie na dashboardzie
 */
export interface DashboardNotificationDTO {
  id: string;
  type: 'PLAN_ASSIGNED' | 'PLAN_UPDATED' | 'INFO';
  title: string;
  message: string;
  date: string;
  link?: string; // Np. link do planu
  isRead: boolean;
}
