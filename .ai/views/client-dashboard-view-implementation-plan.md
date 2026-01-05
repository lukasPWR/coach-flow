# Plan implementacji widoku Panelu Klienta (Client Dashboard)

## 1. Przegląd

Widok Panelu Klienta (`Client Dashboard`) jest centralnym punktem dla zalogowanych użytkowników korzystających z usług trenerów. Jego głównym celem jest prezentacja nadchodzących sesji treningowych oraz statusu wysłanych zapytań o rezerwację. Umożliwia również zarządzanie rezerwacjami (zmiana terminu, anulowanie).

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Strażnicy (Guards):**
  - `AuthGuard`: Wymagane zalogowanie.
  - `RoleGuard`: Wymagana rola `CLIENT` (dla trenerów przewidziany jest osobny dashboard, lub widok jest warunkowy).

## 3. Struktura komponentów

```text
ClientDashboardView (Views/Dashboard/ClientDashboardView.vue)
├── DashboardHeader (Components/Dashboard/DashboardHeader.vue)
├── DashboardStats (Components/Dashboard/DashboardStats.vue)
├── BookingTabs (Components/Bookings/BookingTabs.vue - wrapper na shadcn Tabs)
│   ├── BookingList (Components/Bookings/BookingList.vue)
│   │   ├── BookingCard (Components/Bookings/BookingCard.vue)
│   │   │   ├── BookingStatusBadge (Components/Bookings/BookingStatusBadge.vue)
│   │   │   └── BookingActionsMenu (Components/Bookings/BookingActionsMenu.vue)
│   │   └── PaginationControls (Components/Common/PaginationControls.vue)
├── RescheduleBookingDialog (Components/Bookings/Modals/RescheduleBookingDialog.vue)
└── CancelBookingDialog (Components/Bookings/Modals/CancelBookingDialog.vue)
```

## 4. Szczegóły komponentów

### 1. `ClientDashboardView`

- **Opis:** Główny widok. Pobiera kontekst użytkownika (`/users/me` jeśli nie jest w store) i zarządza układem.
- **Elementy:** Kontener `layout-padding`, nagłówek, statystyki, zakładki.
- **Stan:** Przechowuje informację o wybranej zakładce (domyślnie 'upcoming').

### 2. `DashboardHeader`

- **Opis:** Wyświetla powitanie (np. "Cześć, [Imię]") i datę.
- **Props:** `userName: string`.

### 3. `DashboardStats`

- **Opis:** Szybkie podsumowanie (opcjonalne w MVP, ale zalecane).
- **Props:** `upcomingCount: number`, `pendingCount: number`.

### 4. `BookingList`

- **Opis:** Generyczna lista rezerwacji. Pobiera dane z API na podstawie przekazanych filtrów statusu.
- **Props:**
  - `statuses: BookingStatus[]` - tablica statusów do filtrowania (np. `['ACCEPTED']` dla nadchodzących).
  - `emptyMessage: string` - komunikat gdy brak wyników.
- **Logika:** Obsługuje paginację i stan ładowania (`skeleton loader`).

### 5. `BookingCard`

- **Opis:** Karta prezentująca pojedynczą rezerwację.
- **Elementy:**
  - Data i godzina (duży, czytelny format).
  - Zdjęcie i imię trenera.
  - Nazwa usługi i cena.
  - Badge statusu.
  - Przycisk akcji (trzykropek) dla rezerwacji aktywnych.
- **Props:** `booking: BookingViewModel`.

### 6. `BookingActionsMenu`

- **Opis:** Dropdown menu (shadcn `DropdownMenu`) z akcjami dostępnymi dla danej rezerwacji.
- **Interakcje:**
  - "Zmień termin" -> Emituje zdarzenie `reschedule`.
  - "Anuluj" -> Emituje zdarzenie `cancel`.
- **Walidacja:** Ukrywa opcje dla rezerwacji zakończonych lub anulowanych.

### 7. `RescheduleBookingDialog` & `CancelBookingDialog`

- **Opis:** Modale potwierdzające akcje krytyczne.
- **CancelBookingDialog:** Musi sprawdzać różnicę czasu. Jeśli do wizyty zostało < 12h, wyświetla ostrzeżenie o banie (zgodnie z PRD).

## 5. Typy

Należy utworzyć plik `src/types/bookings.ts` (lub wykorzystać generowane typy, jeśli są dostępne w frontendzie).

```typescript
// Enums (zgodne z backendem)
export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// DTO z API (Paginated Response)
export interface BookingDto {
  id: string
  startTime: string // ISO Date
  endTime: string // ISO Date
  status: BookingStatus
  trainer: {
    id: string
    name: string
    profilePictureUrl?: string
  }
  service: {
    id: string
    name: string
    price: number
    durationMinutes: number
  }
  // ... inne pola
}

// ViewModel (używany w komponentach)
export interface BookingViewModel extends BookingDto {
  isUpcoming: boolean
  canCancel: boolean
  canReschedule: boolean
  formattedDate: string
  formattedTime: string
}

export interface PaginatedBookingsResponse {
  data: BookingDto[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}
```

## 6. Zarządzanie stanem

Zalecane użycie `Vue Reactivity` (Composition API) wewnątrz dedykowanego composable `useBookings`.

### `useBookings(params: UseBookingsParams)`

- **Stan:**
  - `bookings`: `Ref<BookingViewModel[]>`
  - `isLoading`: `Ref<boolean>`
  - `pagination`: `Ref<PaginationMeta>`
  - `filters`: `Reactive<{ status: BookingStatus[], page: number }>`
- **Metody:**
  - `fetchBookings()`: Wywołuje API.
  - `nextPage()`, `prevPage()`.
  - `refresh()`: Przeładowuje dane (np. po anulowaniu).

## 7. Integracja API

**Endpoint Główny:** `GET /bookings`

- **Parametry zapytania (Query Params):**
  - `role`: `'client'` (stałe dla tego widoku).
  - `status`: Wartość zależna od zakładki (np. `ACCEPTED` dla nadchodzących).
  - `page`: `number`.
  - `limit`: `number` (domyślnie 10).

**Endpointy Akcji:**

- **Anulowanie:** `PATCH /bookings/{id}` (Body: `{ status: 'CANCELLED' }`).
- **Zmiana terminu:** `PATCH /bookings/{id}` (Body: `{ startTime: string }`).

## 8. Interakcje użytkownika

1. **Przeglądanie listy:** Użytkownik widzi listę rezerwacji podzieloną na zakładki. Domyślnie otwarta "Nadchodzące".
2. **Paginacja:** Kliknięcie "Dalej" ładuje kolejną stronę wyników z API.
3. **Anulowanie wizyty:**
   - Użytkownik klika "Anuluj" w menu akcji.
   - Otwiera się modal `CancelBookingDialog`.
   - Jeśli czas do wizyty < 12h, modal wyświetla komunikat o karze (blokada na 7 dni).
   - Potwierdzenie wysyła żądanie API.
   - Po sukcesie lista jest odświeżana, a użytkownik otrzymuje powiadomienie "Toast".
4. **Zmiana terminu:**
   - Użytkownik klika "Zmień termin".
   - Otwiera się modal z wyborem nowej daty (integracja z kalendarzem trenera - ten komponent może wymagać osobnego planu, w MVP może to być prosty date-time picker walidowany przez backend).

## 9. Warunki i walidacja

- **Formatowanie dat:** Wszystkie daty z API (UTC) muszą być konwertowane na czas lokalny przeglądarki.
- **Reguła 12h:** W komponencie `CancelBookingDialog` należy obliczyć różnicę: `booking.startTime - now`. Jeśli < 12h -> pokaż ostrzeżenie `text-destructive`.
- **Statusy:**
  - Zakładka "Nadchodzące": status `ACCEPTED` + data przyszła.
  - Zakładka "Oczekujące": status `PENDING`.
  - Zakładka "Historia": statusy `COMPLETED` (logika frontendowa: accepted + data przeszła), `CANCELLED`, `REJECTED`.

## 10. Obsługa błędów

- **Błąd pobierania listy:** Wyświetlenie komponentu `ErrorState` z przyciskiem "Spróbuj ponownie".
- **Błąd akcji (np. anulowanie nie powiodło się):** Zachowanie modala otwartego i wyświetlenie błędu inline lub Toast z komunikatem błędu z API.
- **Pusta lista:** Wyświetlenie komponentu `EmptyState` z zachętą do rezerwacji ("Nie masz jeszcze żadnych rezerwacji. Znajdź trenera!").

## 11. Kroki implementacji

1. **Przygotowanie typów:** Stworzenie interfejsów TypeScript w `src/types`.
2. **Setup API:** Dodanie metod `getBookings`, `updateBooking` do serwisu API (np. `src/api/bookings.ts`).
3. **Komponenty UI (Base):** Upewnienie się, że w projekcie są komponenty shadcn: `Tabs`, `Card`, `Button`, `Badge`, `DropdownMenu`, `Dialog`.
4. **Implementacja `BookingCard`:** Stworzenie karty z podstawowymi danymi i stylem.
5. **Composable `useBookings`:** Implementacja logiki pobierania danych i paginacji.
6. **Implementacja list:** Stworzenie `BookingList` wykorzystującego composable.
7. **Składanie widoku:** Złożenie `ClientDashboardView` z zakładek i list.
8. **Obsługa akcji:** Implementacja `CancelBookingDialog` z logiką 12h.
9. **Integracja:** Podpięcie akcji z kart do modali i wywołanie metod API.
10. **Testy manualne:** Weryfikacja filtrowania, paginacji i odświeżania listy po akcjach.
