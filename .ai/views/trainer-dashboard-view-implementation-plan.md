# Plan implementacji widoku Trainer Dashboard

## 1. Przegląd

Widok Panelu Trenera (`TrainerDashboardPage`) stanowi centrum dowodzenia dla zalogowanego trenera. Jego głównym celem jest prezentacja kluczowych wskaźników (KPI), zarządzanie oczekującymi rezerwacjami (z naciskiem na limit czasowy 24h) oraz zapewnienie szybkiego dostępu do harmonogramu dnia i narzędzi administracyjnych (profil, usługi, kalendarz).

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Guard:** Wymaga uwierzytelnienia i roli `TRAINER`.
- **Plik widoku:** `src/views/trainer/TrainerDashboardPage.vue`

## 3. Struktura komponentów

Widok główny składa się z layoutu siatkowego (Grid), który na urządzeniach mobilnych układa komponenty jeden pod drugim, a na desktopie wykorzystuje dostępną przestrzeń.

*   `TrainerDashboardPage` (Widok główny)
    *   `DashboardHeader` (Powitanie i awatar trenera)
    *   `DashboardGrid` (Kontener układu)
        *   `PendingRequestsWidget` (Sekcja "Pilne" - oczekujące rezerwacje)
            *   `PendingRequestItem` (Pojedynczy wiersz/karta rezerwacji)
                *   `ExpirationTimer` (Licznik czasu do upływu 24h)
                *   `RequestActions` (Przyciski Akceptuj/Odrzuć)
        *   `DailyScheduleWidget` (Agenda na dziś)
            *   `ScheduleItem` (Pojedynczy wpis w kalendarzu)
        *   `QuickActionsWidget` (Kafelki nawigacyjne)
            *   `ActionCard` (Komponent UI kafelka)

## 4. Szczegóły komponentów

### `TrainerDashboardPage`
- **Opis:** Główny kontener strony. Inicjuje pobieranie danych przy montowaniu (`onMounted`). Zarządza stanem ładowania całej strony.
- **Elementy:** `div` (container), `DashboardHeader`, `DashboardGrid`.
- **Typy:** Brak bezpośrednich propsów (widok routingu).

### `DashboardHeader`
- **Opis:** Wyświetla powitanie (np. "Cześć, [Imię]") oraz datę.
- **Props:**
    - `trainerName`: string
- **Elementy:** `h1`, `p` (data).

### `PendingRequestsWidget`
- **Opis:** Wyświetla listę rezerwacji ze statusem `PENDING`. Sortuje je od tych, którym zostało najmniej czasu do wygaśnięcia.
- **Props:**
    - `requests`: `PendingBookingVM[]`
    - `isLoading`: boolean
- **Zdarzenia:**
    - `approve`: `(id: string) => void`
    - `reject`: `(id: string) => void`
- **Elementy:**
    - Nagłówek "Oczekujące wnioski".
    - Lista komponentów `PendingRequestItem` lub `EmptyState` (jeśli brak wniosków).

### `PendingRequestItem`
- **Opis:** Prezentuje szczegóły wniosku: imię klienta, usługę, termin oraz licznik czasu.
- **Props:**
    - `request`: `PendingBookingVM`
- **Elementy:**
    - Informacje o kliencie i usłudze.
    - `ExpirationTimer` (pokazuje np. "Wygasa za: 2h 15m" - kolor czerwony, gdy < 2h).
    - Przyciski akcji (Akceptuj - zielony, Odrzuć - szary/czerwony).

### `DailyScheduleWidget`
- **Opis:** Wyświetla listę zaakceptowanych wizyt na bieżący dzień.
- **Props:**
    - `sessions`: `DailySessionVM[]`
    - `isLoading`: boolean
- **Elementy:**
    - Nagłówek "Dzisiejszy plan".
    - Lista `ScheduleItem` posortowana chronologicznie.
    - Komponent `EmptyState` ("Brak treningów na dziś").

### `QuickActionsWidget`
- **Opis:** Statyczna sekcja z kartami nawigacyjnymi do innych modułów.
- **Elementy:**
    - Karta "Kalendarz" -> `/calendar`
    - Karta "Usługi" -> `/services`
    - Karta "Profil" -> `/profile`
    - Karta "Klienci" -> `/clients` (opcjonalnie w przyszłości)

## 5. Typy

Należy utworzyć plik `src/types/dashboard.ts` lub `src/view-models/trainer-dashboard.ts`.

### Modele Widoku (ViewModel)

```typescript
// Reprezentacja oczekującej rezerwacji w UI
export interface PendingBookingVM {
  id: string; // UUID rezerwacji
  clientName: string; // Imię i nazwisko klienta
  serviceName: string; // Nazwa usługi
  startTime: string; // Sformatowana data ISO
  formattedDate: string; // np. "26.11.2025"
  formattedTime: string; // np. "10:00 - 11:00"
  createdAt: string; // Data utworzenia wniosku
  expiresAt: string; // createdAt + 24h
  isUrgent: boolean; // true jeśli do końca zostało < 2h
}

// Reprezentacja sesji w agendzie dziennej
export interface DailySessionVM {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  timeRange: string; // np. "14:00 - 15:00"
  status: 'ACCEPTED';
}
```

### DTO (Data Transfer Objects)

Wykorzystujemy wygenerowane wcześniej typy z backendu:
- `PaginatedBookingsResponseDto`
- `BookingStatus` (enum)
- `UserBookingRole` (enum)

## 6. Zarządzanie stanem

Zalecane jest użycie **Composable** `useTrainerDashboard` (`src/composables/useTrainerDashboard.ts`), który hermetyzuje logikę biznesową widoku.

- **Stan (Reactive):**
    - `pendingBookings`: `PendingBookingVM[]`
    - `todaysSessions`: `DailySessionVM[]`
    - `isLoading`: `boolean`
    - `trainerName`: `string`
- **Metody:**
    - `fetchDashboardData()`: Wykonuje równoległe zapytania do API (`Promise.all`).
    - `approveBooking(id: string)`: Wywołuje API, a następnie usuwa element z listy `pendingBookings` i (opcjonalnie) dodaje do `todaysSessions` jeśli data pasuje.
    - `rejectBooking(id: string)`: Wywołuje API, usuwa element z listy.
    - `calculateExpiration(createdAt: string)`: Funkcja pomocnicza do mapowania VM.

## 7. Integracja API

Integracja poprzez serwis `BookingsService` (frontend).

### Żądania

1.  **Pobranie oczekujących rezerwacji:**
    -   Metoda: `GET`
    -   Endpoint: `/bookings`
    -   Parametry: `{ status: 'PENDING', role: 'trainer', limit: 10, page: 1 }`
    -   Cel: Zasilenie `PendingRequestsWidget`.

2.  **Pobranie dzisiejszych sesji:**
    -   Metoda: `GET`
    -   Endpoint: `/bookings`
    -   Parametry: `{ status: 'ACCEPTED', role: 'trainer', limit: 50 }`
    -   *Uwaga:* API na tym etapie nie wspiera filtrowania po dacie (`dateFrom`/`dateTo`). Należy pobrać zaakceptowane rezerwacje i przefiltrować je po stronie klienta (Client-side filtering) pod kątem dzisiejszej daty.

3.  **Akceptacja rezerwacji:**
    -   Metoda: `POST`
    -   Endpoint: `/bookings/:id/approve`
    -   Body: brak.

4.  **Odrzucenie rezerwacji:**
    -   Metoda: `POST`
    -   Endpoint: `/bookings/:id/reject`
    -   Body: brak.

5.  **Dane trenera:**
    -   Metoda: `GET`
    -   Endpoint: `/trainers/me` (lub pobranie z `AuthStore` jeśli dane są tam przechowywane).

## 8. Interakcje użytkownika

1.  **Akceptacja wniosku:**
    -   Użytkownik klika "Akceptuj".
    -   Przycisk zmienia stan na `loading`.
    -   Po sukcesie: Wyświetla się Toast "Rezerwacja zaakceptowana", kafelek znika z listy "Oczekujące". Jeśli termin jest dzisiaj, pojawia się w "Agenda".
2.  **Odrzucenie wniosku:**
    -   Użytkownik klika "Odrzuć".
    -   (Opcjonalnie: Modal z potwierdzeniem, ale dla MVP wystarczy bezpośrednia akcja lub Toast z "Undo" - tutaj prosta akcja).
    -   Po sukcesie: Toast "Rezerwacja odrzucona", kafelek znika.
3.  **Kliknięcie w kafelek "Szybkie akcje":**
    -   Przekierowanie routera do odpowiedniej podstrony.

## 9. Warunki i walidacja

-   **Limit 24h:** Frontend musi obliczyć czas pozostały do akceptacji.
    -   Wzór: `Remaining = (CreatedAt + 24h) - Now`.
    -   Jeśli `Remaining <= 0`: Wyświetl komunikat "Wygasło" i zablokuj przyciski akcji (lub ukryj wniosek, zależnie od logiki backendu - czy cron już to sprzątnął).
    -   Jeśli `Remaining < 2h`: Dodaj wizualny wskaźnik pilności (np. czerwony badge).
-   **Sortowanie:**
    -   Oczekujące: Od najstarszych (najpilniejszych).
    -   Agenda: Od najwcześniejszej godziny.

## 10. Obsługa błędów

-   **Błąd ładowania danych:** Wyświetlenie `ErrorStateWidget` w miejscu widgetu z przyciskiem "Spróbuj ponownie".
-   **Błąd akcji (np. rezerwacja już nieaktualna/zajęta):**
    -   API zwróci `404` lub `409`.
    -   Frontend wyświetla Toast z komunikatem błędu (np. "Ta rezerwacja nie jest już dostępna").
    -   Odświeżenie listy rezerwacji, aby zsynchronizować stan.

## 11. Kroki implementacji

1.  **Przygotowanie Typów i Serwisu:**
    -   Stworzenie interfejsów ViewModel w `src/types`.
    -   Rozszerzenie serwisu `api/bookings.ts` o metody `getPendingBookings`, `getTodaysSchedule`, `approveBooking`, `rejectBooking`.
2.  **Implementacja Composables:**
    -   Stworzenie `useTrainerDashboard` z logiką pobierania danych i mapowania na ViewModel (w tym obliczanie czasu wygaśnięcia).
3.  **Budowa Komponentów Atomowych:**
    -   Stworzenie `ActionCard.vue` (dla szybkich akcji).
    -   Stworzenie `PendingRequestItem.vue` z logiką licznika czasu.
    -   Stworzenie `ScheduleItem.vue`.
4.  **Budowa Widgetów:**
    -   Złożenie widgetów `PendingRequestsWidget`, `DailyScheduleWidget`, `QuickActionsWidget`.
5.  **Implementacja Widoku Głównego:**
    -   Utworzenie `TrainerDashboardPage.vue`.
    -   Połączenie z `useTrainerDashboard`.
    -   Dodanie responsywnego Gridu (Tailwind CSS).
6.  **Routing:**
    -   Dodanie ścieżki w `router/index.ts` z odpowiednim Guardem.
7.  **Testy Manualne:**
    -   Weryfikacja wyglądu na mobile/desktop.
    -   Sprawdzenie działania przycisków akcji.
    -   Weryfikacja licznika czasu.

