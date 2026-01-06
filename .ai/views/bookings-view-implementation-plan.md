# Plan implementacji widoku Bookings (Rezerwacje)

## 1. Przegląd

Widok `/bookings` służy jako centralne miejsce do zarządzania rezerwacjami zarówno dla Trenera, jak i Klienta. Umożliwia przeglądanie rezerwacji w podziale na statusy (Oczekujące, Nadchodzące, Historia), paginację wyników oraz wykonywanie akcji na rezerwacjach (Akceptacja, Odrzucenie, Anulowanie) zgodnie z rolą użytkownika i zasadami biznesowymi.

## 2. Routing widoku

- **Ścieżka:** `/bookings`
- **Nazwa trasy:** `Bookings`
- **Wymagane uwierzytelnienie:** Tak (Guard autoryzacji)

## 3. Struktura komponentów

```text
BookingsView (Views/BookingsView.vue)
├── BookingsPageHeader (Nagłówek z tytułem i przełącznikiem roli, jeśli dotyczy)
├── BookingsTabs (Nawigacja zakładkowa: Oczekujące | Nadchodzące | Anulowane | Odrzucone)
│   └── TabsTrigger (shadcn)
├── BookingsFilterBar (Opcjonalne dodatkowe filtry)
├── BookingsList (Kontener listy)
│   ├── BookingCard (Pojedynczy element rezerwacji)
│   │   ├── BookingCardHeader (Data, Godzina, StatusBadge)
│   │   ├── BookingCardContent (Szczegóły: Usługa, Cena, Awatar Klienta/Trenera)
│   │   └── BookingCardFooter (Akcje: Akceptuj, Odrzuć, Anuluj)
│   └── EmptyState (Komponent pustego stanu)
├── PaginationControls (Paginacja)
└── BookingActionDialog (Dialog potwierdzenia dla Anuluj/Odrzuć)
```

## 4. Szczegóły komponentów

### `BookingsView.vue` (Page Component)

- **Opis:** Główny kontener widoku. Zarządza stanem URL (query params) dla wybranej zakładki (statusu) i numeru strony.
- **Główne elementy:** `Tabs`, `BookingsList`, `Pagination`.
- **Obsługiwane interakcje:** Zmiana zakładki, zmiana strony, zmiana roli (dla użytkowników dual-role).
- **Logika:** Synchronizacja parametrów URL ze stanem aplikacji, wywoływanie `useBookings`.

### `BookingsTabs.vue`

- **Opis:** Komponent prezentacyjny oparty na `shadcn-vue/tabs`.
- **Mapowanie zakładek na API status:**
  - "Oczekujące" -> `PENDING`
  - "Nadchodzące" -> `ACCEPTED`
  - "Odrzucone" -> `REJECTED`
  - "Anulowane" -> `CANCELLED`

### `BookingCard.vue`

- **Opis:** Karta prezentująca pojedynczą rezerwację. Wyświetla inne dane w zależności od tego, czy użytkownik jest Trenerem czy Klientem (np. Trener widzi dane Klienta).
- **Propsy:**
  - `booking: Booking` (wymagane)
  - `currentUserRole: UserRole` (wymagane)
- **Komponenty dzieci:**
  - `StatusBadge`: Kolorowa etykieta statusu (Żółta-Pending, Zielona-Accepted, Czerwona-Rejected/Cancelled).
  - `UserAvatar`: Wyświetla zdjęcie i imię drugiej strony (Klienta lub Trenera).
- **Akcje (Warunkowe):**
  - **Przycisk "Akceptuj"**: Widoczny tylko dla Trenera, gdy status `PENDING`.
  - **Przycisk "Odrzuć"**: Widoczny tylko dla Trenera, gdy status `PENDING`.
  - **Przycisk "Anuluj"**: Widoczny dla obu ról, gdy status `PENDING` lub `ACCEPTED`.

### `BookingActionDialog.vue`

- **Opis:** Modal potwierdzający destrukcyjne akcje.
- **Specjalna logika:** Przy anulowaniu rezerwacji `ACCEPTED` na mniej niż 12h przed terminem, wyświetla ostrzeżenie o blokadzie (Ban).

## 5. Typy

Należy utworzyć plik `src/types/bookings.ts` (lub wykorzystać istniejący, jeśli jest), zawierający:

```typescript
// Enumy zgodne z backendem
export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  CLIENT = 'client', // Małe litery zgodnie z API query param, ale enum backendu może mieć duże
  TRAINER = 'trainer',
}

// Interfejsy encji
export interface BookingUser {
  id: string
  name: string
  avatarUrl?: string // Opcjonalne, jeśli backend zwraca
}

export interface BookingService {
  id: string
  name: string
  price: number
  durationMinutes: number
}

export interface Booking {
  id: string
  startTime: string // ISO Date String
  endTime: string // ISO Date String
  status: BookingStatus
  client: BookingUser
  trainer: BookingUser
  service: BookingService
  createdAt: string
}

// Typy API
export interface GetBookingsParams {
  status?: BookingStatus
  role?: UserRole
  page?: number
  limit?: number
}

export interface PaginationMeta {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export interface BookingsResponse {
  data: Booking[]
  meta: PaginationMeta
}
```

## 6. Zarządzanie stanem

Wykorzystanie **Composables** (Composition API) do zarządzania logiką.

### `useBookings.ts`

Zarządza pobieraniem danych listy.

- **State:**
  - `bookings`: `Ref<Booking[]>`
  - `isLoading`: `Ref<boolean>`
  - `pagination`: `Ref<PaginationMeta>`
  - `filters`: `Reactive<GetBookingsParams>`
- **Actions:**
  - `fetchBookings()`: Wywołuje API z aktualnymi filtrami.
  - `changeTab(status: BookingStatus)`: Aktualizuje filtr i resetuje stronę.
  - `changePage(page: number)`: Aktualizuje stronę.

### `useBookingActions.ts`

Zarządza pojedynczymi akcjami na rezerwacji.

- **State:**
  - `isProcessing`: `Ref<boolean>` (dla spinnerów na przyciskach)
- **Actions:**
  - `approveBooking(id: string)`: `POST /bookings/:id/approve`
  - `rejectBooking(id: string)`: `POST /bookings/:id/reject`
  - `cancelBooking(id: string)`: `POST /bookings/:id/cancel`

## 7. Integracja API

Integracja z endpointami zdefiniowanymi w `api-plan.md`. Należy użyć istniejącego klienta HTTP (np. axios wrapper w `src/lib/api`).

- **GET** `/bookings`: Pobieranie listy. Parametry query muszą być przekonwertowane z obiektów Vue na stringi URL.
- **POST** `/bookings/:id/approve`: Bez body. Oczekuje `200 OK`.
- **POST** `/bookings/:id/reject`: Bez body. Oczekuje `200 OK`.
- **POST** `/bookings/:id/cancel`: Bez body. Oczekuje `200 OK`.

## 8. Interakcje użytkownika

1.  **Wejście na stronę:**
    - Aplikacja sprawdza query params w URL. Jeśli brak, ustawia domyślne (Status: `PENDING`, Page: 1).
    - Ładowanie danych (Skeleton loader).
2.  **Zmiana zakładki:**
    - Kliknięcie w np. "Nadchodzące".
    - URL zmienia się na `?status=ACCEPTED&page=1`.
    - Lista odświeża się.
3.  **Akceptacja rezerwacji (Trener):**
    - Kliknięcie "Akceptuj".
    - Wywołanie API.
    - Po sukcesie: Toast "Rezerwacja zaakceptowana", usunięcie rezerwacji z listy "Oczekujące" (odświeżenie listy).
4.  **Anulowanie rezerwacji:**
    - Kliknięcie "Anuluj".
    - Otwarcie Dialogu: "Czy na pewno chcesz anulować?".
    - Jeśli to późne anulowanie (nadchodzące < 12h): Wyświetlenie ostrzeżenia o blokadzie.
    - Potwierdzenie -> API -> Toast -> Odświeżenie listy.

## 9. Warunki i walidacja

Walidacja odbywa się głównie poprzez warunkowe wyświetlanie elementów interfejsu (`v-if`):

1.  **Widoczność przycisków akcji:**

    - `Akceptuj/Odrzuć`: Widoczne TYLKO gdy `currentUser.role === 'trainer'` ORAZ `booking.status === 'PENDING'`.
    - `Anuluj`: Widoczne gdy `status` to `PENDING` lub `ACCEPTED`.

2.  **Formatowanie danych:**
    - Daty: Użycie `Intl.DateTimeFormat` lub `date-fns` do wyświetlania daty w formacie czytelnym dla użytkownika (np. "Poniedziałek, 12 Maja 14:00").
    - Cena: Formatowanie walutowe (PLN).

## 10. Obsługa błędów

- **Błąd pobierania listy:** Wyświetlenie komunikatu błędu w miejscu listy z przyciskiem "Spróbuj ponownie".
- **Błąd akcji (4xx/5xx):**
  - Jeśli API zwróci `409 Conflict` (np. rezerwacja już nie jest Pending), wyświetl Toast z informacją "Status rezerwacji uległ zmianie" i odśwież listę automatycznie.
  - Generyczne błędy: Toast "Wystąpił błąd. Spróbuj ponownie."

## 11. Kroki implementacji

1.  **Setup Typów:** Utworzenie `frontend/src/types/bookings.ts` i zdefiniowanie interfejsów oraz enumów.
2.  **Warstwa API:** Dodanie funkcji w `frontend/src/lib/api/bookings.ts` obsługujących endpointy (fetch, approve, reject, cancel).
3.  **Composables:** Implementacja `useBookings` (z obsługą filtrów i paginacji) oraz `useBookingActions`.
4.  **Komponenty UI - Podstawowe:**
    - Stworzenie `BookingStatusBadge.vue`.
    - Stworzenie `BookingCard.vue` (bez logiki akcji na początku).
5.  **Komponenty UI - Lista:**
    - Implementacja `BookingsList.vue` z obsługą pętli i stanu pustego.
6.  **Widok Główny:**
    - Implementacja `BookingsView.vue`.
    - Konfiguracja `Tabs` i synchronizacja z `useBookings`.
7.  **Logika Akcji:**
    - Podpięcie `useBookingActions` do przycisków w `BookingCard`.
    - Dodanie `BookingActionDialog` dla potwierdzeń.
8.  **Integracja Routera:** Dodanie trasy w `router/index.ts`.
9.  **Testy manualne:** Weryfikacja scenariuszy dla Trenera i Klienta, sprawdzanie paginacji i odświeżania po akcjach.
