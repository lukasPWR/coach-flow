# Plan implementacji widoku Moje Rezerwacje (My Bookings)

## 1. Przegląd

Widok "Moje Rezerwacje" służy do zarządzania wszystkimi rezerwacjami zalogowanego użytkownika (zarówno klienta, jak i trenera). Umożliwia przeglądanie rezerwacji z podziałem na statusy (nadchodzące, oczekujące, historia), anulowanie wizyt oraz (opcjonalnie) zmianę terminu. Kluczowym elementem jest obsługa logiki biznesowej związanej z karami za późne anulowanie rezerwacji (< 12h).

## 2. Routing widoku

- **Ścieżka:** `/my-bookings`
- **Nazwa trasy:** `MyBookings`
- **Wymagane uwierzytelnienie:** Tak (Guard autoryzacji)

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o bibliotekę `shadcn-vue`.

- `MyBookingsView` (Page Component)
  - `PageHeader` (Tytuł i opis)
  - `BookingTabs` (Komponent `Tabs` z shadcn-vue)
    - Tab: "Nadchodzące"
    - Tab: "Oczekujące"
    - Tab: "Historia"
  - `BookingList` (Kontener listy)
    - `BookingCard` (Pojedynczy element listy)
      - `BookingStatusBadge` (Wizualizacja statusu)
      - `BookingActions` (Przyciski: Anuluj, Zmień termin)
    - `EmptyState` (Gdy brak rezerwacji w danej kategorii)
    - `Pagination` (Komponent `Pagination` z shadcn-vue)
  - `CancelBookingDialog` (Modal potwierdzenia anulowania - `AlertDialog`)

## 4. Szczegóły komponentów

### `MyBookingsView`

- **Opis:** Główny widok strony. Zarządza stanem aktywnej zakładki i wywołuje pobieranie danych.
- **Główne elementy:** `div` (layout), `h1`, `BookingTabs`.
- **Obsługiwane interakcje:** Zmiana zakładki (powoduje przeładowanie listy z innym filtrem statusu).
- **Typy:** Brak propsów.
- **Odpowiedzialność:** Inicjalizacja `useBookings`, przekazywanie danych do listy.

### `BookingTabs`

- **Opis:** Wrapper na komponent `Tabs` z shadcn-vue.
- **Główne elementy:** `Tabs`, `TabsList`, `TabsTrigger`.
- **Obsługiwane interakcje:** Emisja zdarzenia zmiany kategorii (`upcoming`, `pending`, `history`).
- **Propsy:** `modelValue` (aktualna zakładka).

### `BookingList`

- **Opis:** Wyświetla listę kart rezerwacji lub stan ładowania/pusty.
- **Główne elementy:** `div` (grid/flex column), pętla `v-for` po rezerwacjach, `Skeleton` (podczas ładowania).
- **Propsy:**
  - `bookings`: `BookingViewModel[]`
  - `isLoading`: `boolean`
- **Obsługiwane zdarzenia:**
  - `cancel`: przekazuje ID rezerwacji do widoku głównego (otwiera modal).
  - `reschedule`: przekazuje ID rezerwacji (nawigacja/modal).

### `BookingCard`

- **Opis:** Karta prezentująca szczegóły pojedynczej rezerwacji: datę, godzinę, nazwę usługi, trenera/klienta oraz cenę.
- **Główne elementy:** `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Avatar` (trenera/usługi).
- **Typy:** Wymaga obiektu `BookingViewModel`.
- **Propsy:**
  - `booking`: `BookingViewModel`
- **Logika wyświetlania akcji:**
  - Przycisk "Anuluj": Widoczny tylko dla statusów `PENDING` i `ACCEPTED`.
  - Przycisk "Zmień termin": Widoczny dla `ACCEPTED` (zależnie od logiki biznesowej, może być wyłączony).
- **Warunki walidacji:** Sprawdzenie czy data rezerwacji jest w przyszłości.

### `CancelBookingDialog`

- **Opis:** Modal ostrzegający przed anulowaniem. Jeśli do wizyty zostało < 12h, wyświetla dodatkowe ostrzeżenie o blokadzie (ban).
- **Główne elementy:** `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogDescription`.
- **Propsy:**
  - `open`: `boolean`
  - `booking`: `BookingViewModel | null`
- **Obsługiwane interakcje:** Potwierdzenie anulowania (emituje `confirm`), zamknięcie (emituje `close`).
- **Logika:** Oblicza różnicę czasu między `now()` a `booking.startTime`. Jeśli < 12h, zmienia treść komunikatu na ostrzegawczy (czerwony tekst/alert).

## 5. Typy

Należy utworzyć plik `frontend/src/types/bookings.ts` (lub rozszerzyć istniejący).

```typescript
// Enums
export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// Bazowy interfejs (zgodny z backendem)
export interface BookingDto {
  id: string
  startTime: string // ISO String
  endTime: string
  status: BookingStatus
  clientId: string
  trainerId: string
  serviceId: string
  createdAt: string
}

// ViewModel używany w widoku (zakładamy, że API zwraca relacje lub je mapujemy)
export interface BookingViewModel extends BookingDto {
  trainer: {
    id: string
    name: string // np. imię i nazwisko z User
    profilePictureUrl?: string
  }
  service: {
    id: string
    name: string // np. "Trening Personalny"
    price: number
    durationMinutes: number
  }
}

export type BookingTab = 'upcoming' | 'pending' | 'history'
```

## 6. Zarządzanie stanem

Zalecane użycie composable `useMyBookings` (`frontend/src/composables/useMyBookings.ts`).

- **Stan:**
  - `bookings`: `Ref<BookingViewModel[]>`
  - `isLoading`: `Ref<boolean>`
  - `activeTab`: `Ref<BookingTab>`
  - `pagination`: `Ref<{ page: number, limit: number, total: number }>`
- **Gettery/Computed:**
  - `queryParams`: Mapuje `activeTab` na parametry API (np. `status=ACCEPTED` dla 'upcoming').
- **Metody:**
  - `fetchBookings()`: Wywołuje API.
  - `cancelBooking(id: string)`: Wywołuje API anulowania i odświeża listę.

## 7. Integracja API

Widok będzie korzystał z następujących endpointów (przy użyciu `axios` skonfigurowanego w projekcie):

1.  **Pobieranie listy:**

    - **Metoda:** `GET`
    - **Endpoint:** `/bookings`
    - **Parametry:**
      - `page`: number
      - `limit`: number
      - `status`: Zależny od zakładki.
        - Nadchodzące: `ACCEPTED` (i data > teraz)
        - Oczekujące: `PENDING`
        - Historia: `REJECTED,CANCELLED` oraz `ACCEPTED` (gdzie data < teraz).
    - **Odpowiedź:** `{ data: BookingViewModel[], meta: PaginationMeta }`

2.  **Anulowanie rezerwacji:**
    - **Metoda:** `POST`
    - **Endpoint:** `/bookings/:id/cancel`
    - **Odpowiedź:** `200 OK` (zaktualizowana rezerwacja).

## 8. Interakcje użytkownika

1.  **Zmiana zakładki:** Użytkownik klika "Oczekujące" -> Lista przeładowuje się, pokazując tylko rezerwacje ze statusem `PENDING`.
2.  **Anulowanie (Bezpieczne):** Użytkownik klika "Anuluj" przy rezerwacji za 3 dni -> Modal pyta "Czy na pewno?".
3.  **Anulowanie (Late Cancel):** Użytkownik klika "Anuluj" przy rezerwacji za 4 godziny -> Modal wyświetla ostrzeżenie: "Uwaga! Anulowanie na mniej niż 12h przed terminem skutkuje blokadą konta na 7 dni." -> Użytkownik potwierdza -> API zwraca sukces -> UI wyświetla Toast "Rezerwacja anulowana".
4.  **Paginacja:** Użytkownik klika następną stronę -> Ładowanie nowych danych.

## 9. Warunki i walidacja

- **Data rezerwacji:** Frontend musi weryfikować `startTime` względem obecnego czasu, aby:
  - Przypisać rezerwację `ACCEPTED` do zakładki "Nadchodzące" lub "Historia".
  - Wyświetlić odpowiedni komunikat w modalu anulowania (reguła 12h).
- **Statusy:** Przyciski akcji są warunkowe:
  - Anulować można tylko `PENDING` i `ACCEPTED` (przyszłe).
  - `REJECTED` i `CANCELLED` są tylko do odczytu.

## 10. Obsługa błędów

- **Błąd pobierania listy:** Wyświetlenie komunikatu błędu w miejscu listy (np. "Nie udało się załadować rezerwacji. Spróbuj ponownie").
- **Błąd anulowania:**
  - Jeśli API zwróci błąd (np. 409 Conflict lub 400), wyświetlenie `Toast` z komunikatem błędu (np. "Nie można anulować rezerwacji, która już się odbyła").
  - Obsługa bana: Jeśli użytkownik zostanie zbanowany w wyniku anulowania, backend powinien zwrócić odpowiednią informację, a frontend może wyświetlić odpowiedni alert.

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Utworzenie `frontend/src/types/bookings.ts` z definicjami DTO i ViewModel.
2.  **Implementacja Composable:** Stworzenie `useMyBookings` z logiką pobierania danych i mapowania statusów.
3.  **Budowa komponentów UI (atomowych):**
    - Stworzenie `BookingStatusBadge.vue`.
    - Stworzenie `BookingCard.vue` z logiką wyświetlania przycisków.
4.  **Implementacja Modalu:** Stworzenie `CancelBookingDialog.vue` z logiką obliczania czasu do wizyty (12h).
5.  **Złożenie widoku:**
    - Implementacja `BookingTabs` i `BookingList` w `MyBookingsView.vue`.
    - Podpięcie `useMyBookings`.
6.  **Routing:** Dodanie ścieżki `/my-bookings` w routerze aplikacji.
7.  **Integracja i Testy:**
    - Weryfikacja wyświetlania poprawnych rezerwacji w zakładkach.
    - Test manualny anulowania (scenariusz bezpieczny i z karą).
    - Dostosowanie stylów (Tailwind) i responsywności (Mobile View).
