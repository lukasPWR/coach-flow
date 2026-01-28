# Plan aktualizacji Dashboardu o funkcje treningowe

## 1. Przegląd

Ten plan opisuje proces rozbudowy istniejącego widoku `ClientDashboardView.vue` o funkcjonalności związane z planami treningowymi, zgodnie z dokumentem `.ai/training-plans-ui-plan.md`. Celem jest integracja nowych widgetów (Powiadomienia, Aktywny Plan) z istniejącą sekcją rezerwacji (BookingList), aby stworzyć spójny panel klienta.

## 2. Istniejący stan widoku

Obecny plik `ClientDashboardView.vue` zawiera:

- `DashboardHeader`: Nagłówek powitalny.
- `DashboardStats`: Statystyki sesji (nadchodzące, oczekujące).
- `Tabs` (Upcoming, Pending, History): Lista rezerwacji (`BookingList`).
- Dialogi anulowania/przekładania wizyt.

## 3. Nowe komponenty do integracji

### 3.1. NotificationWidget (Nowy)

- **Lokalizacja:** Pomiędzy `DashboardHeader` a `DashboardStats` (lub na samym szczycie pod headerem).
- **Cel:** Wyświetlanie powiadomień o nowych planach (US-009).
- **Ścieżka:** `frontend/src/components/dashboard/NotificationWidget.vue`

### 3.2. ActivePlanSection / ActivePlanCard (Nowy)

- **Lokalizacja:** Pomiędzy `DashboardStats` a `Tabs`. To kluczowe miejsce, zapewniające szybki dostęp do treningu (US-010).
- **Cel:** Karta prowadząca do aktualnego planu.
- **Ścieżka:** `frontend/src/components/training-plans/ActivePlanCard.vue`

## 4. Plan zmian w kodzie (ClientDashboardView.vue)

### 4.1. Zmiany w `<template>`

1.  Dodanie `<NotificationWidget>` pod `<div class="flex flex-col...">` (headerem).
2.  Dodanie `<ActivePlanCard>` pod `<DashboardStats>` a przed `<Tabs>`.
3.  Opcjonalnie: Opakowanie sekcji w Grid lub Flex dla lepszego układu na desktopie.

### 4.2. Zmiany w `<script setup>`

1.  Import nowych komponentów.
2.  Import composable'a `useClientDashboard` (do stworzenia) lub rozszerzenie logiki o pobieranie planów.
3.  Dodanie wywołania `trainingPlansApi.getTrainingPlans({ status: 'ACTIVE' })` w `onMounted` (równolegle z `loadStats`).

## 5. Nowe pliki i logika

### 5.1. `src/composables/useDashboardTrainingSummary.ts`

Utworzenie composable, który separuje logikę treningową od rezerwacji:

```typescript
export function useDashboardTrainingSummary() {
  const activePlan = ref<TrainingPlanHeaderDTO | null>(null)
  const notifications = ref<DashboardNotificationDTO[]>([])

  const loadTrainingSummary = async () => {
    // Pobranie planów i wyliczenie powiadomień
  }

  return { activePlan, notifications, loadTrainingSummary }
}
```

## 6. Integracja API (istniejące + nowe)

Istniejący kod używa `bookingsApi`. Należy dodać użycie `trainingPlansApi` (zdefiniowanego w innych planach).

## 7. Kroki implementacji (Merge Plan)

1.  **Stwórz komponenty UI:** `NotificationWidget.vue` i `ActivePlanCard.vue`.
2.  **Stwórz logikę:** `useDashboardTrainingSummary.ts` (pobieranie aktywnego planu).
3.  **Edytuj `ClientDashboardView.vue`:**
    - Zaimportuj `useDashboardTrainingSummary`.
    - Dodaj wywołanie `loadTrainingSummary()` w `onMounted` (obok `loadStats()`).
    - Wstaw komponenty `<NotificationWidget>` i `<ActivePlanCard>` w template.
4.  **Testy:** Sprawdź czy dashboard ładuje się poprawnie zarówno z planami jak i bez (puste stany).
