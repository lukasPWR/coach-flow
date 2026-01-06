# Plan implementacji widoku Kalendarza Trenera (Trainer Calendar)

## 1. Przegląd

Widok Kalendarza Trenera (`CalendarView`) jest centralnym miejscem zarządzania czasem pracy trenera. Umożliwia wizualizację harmonogramu, w tym zaakceptowanych rezerwacji klientów oraz bloków niedostępności (np. urlopy, przerwy). Kluczową funkcjonalnością jest możliwość intuicyjnego dodawania, edycji i usuwania niedostępności poprzez interfejs "przeciągnij i upuść" (drag & drop) oraz formularze modalne.

## 2. Routing widoku

- **Ścieżka:** `/calendar` (zgodnie z `ui-plan.md`)
- **Dostęp:** Wymaga zalogowania (Guard) oraz roli `TRAINER`.

## 3. Struktura komponentów

```text
src/views/trainer/CalendarView.vue (Smart Component - Logic & State)
├── src/components/ui/PageHeader.vue (Komponent nagłówka, opcjonalny)
├── src/components/calendar/FullCalendarWrapper.vue (Dumb Component - Presentation)
│   └── @fullcalendar/vue3 (Zewnętrzna biblioteka)
└── src/components/calendar/UnavailabilityModal.vue (Formularz w Dialogu)
```

## 4. Szczegóły komponentów

### 1. `CalendarView.vue` (Widok)

- **Opis:** Główny kontener widoku. Odpowiada za komunikację z API (pobieranie danych, wysyłanie zmian), zarządzanie stanem ładowania i błędów oraz sterowanie widocznością modala. Łączy dane o rezerwacjach i niedostępnościach w jeden strumień zdarzeń dla kalendarza.
- **Główne elementy:**
  - Kontener layoutu (padding, responsywność).
  - `<FullCalendarWrapper>` - wyświetlanie siatki.
  - `<UnavailabilityModal>` - obsługa formularza.
- **Obsługiwane interakcje:**
  - `handleDateSelect`: Otwiera modal w trybie tworzenia z wybranym zakresem dat.
  - `handleEventClick`:
    - Jeśli typ to `UNAVAILABILITY`: Otwiera modal w trybie edycji.
    - Jeśli typ to `BOOKING`: Wyświetla toast/tooltip z informacją (edycja zablokowana).
  - `handleEventChange` (Drop/Resize): Wywołuje API `PATCH` dla niedostępności.
- **Typy:** Używa hooka `useTrainerCalendar`.

### 2. `FullCalendarWrapper.vue` (Komponent)

- **Opis:** Wrapper na bibliotekę `@fullcalendar/vue3` i wtyczki (`dayGrid`, `timeGrid`, `interaction`). Konfiguruje wygląd kalendarza, formaty dat i obsługuje zdarzenia bezpośrednio z biblioteki, emitując znormalizowane zdarzenia w górę.
- **Główne elementy:**
  - `<FullCalendar>` z wtyczkami: `dayGridPlugin`, `timeGridPlugin`, `interactionPlugin`.
- **Propsy:**
  - `events`: `CalendarEvent[]` - tablica wydarzeń do wyświetlenia.
  - `isLoading`: `boolean` - stan ładowania (opcjonalnie do wyświetlenia skeletonu/spinnera).
- **Emitowane zdarzenia:**
  - `select(info: DateSelectArg)` - zaznaczenie zakresu czasu.
  - `event-click(info: EventClickArg)` - kliknięcie w zdarzenie.
  - `event-change(info: EventChangeArg)` - zmiana czasu (D&D, resize).
- **Stylizacja:** Nadpisanie domyślnych stylów FullCalendar klasami Tailwind CSS (poprzez `::v-deep` lub globalne style), aby pasowały do design system (shadcn).

### 3. `UnavailabilityModal.vue` (Komponent)

- **Opis:** Modal (Dialog) zawierający formularz dodawania lub edycji niedostępności.
- **Główne elementy:**
  - `Dialog`, `DialogContent`, `DialogHeader` (shadcn-vue).
  - Formularz z polami: Data/Czas Start, Data/Czas Koniec.
  - Przyciski: "Zapisz", "Anuluj" oraz "Usuń" (tylko w trybie edycji).
- **Propsy:**
  - `isOpen`: `boolean`.
  - `initialData`: `CreateUnavailabilityDto | null` (dane do edycji lub pre-fill z kalendarza).
  - `mode`: `'CREATE' | 'EDIT'`.
  - `isLoading`: `boolean`.
- **Emitowane zdarzenia:**
  - `close` - zamknięcie modala.
  - `save(data: CreateUnavailabilityDto)` - zapisanie zmian.
  - `delete(id: string)` - usunięcie niedostępności.
- **Walidacja:**
  - Pola wymagane.
  - Data końca musi być późniejsza niż data początku.

## 5. Typy

Należy utworzyć plik `src/types/calendar.ts`:

```typescript
import { Booking } from './bookings'; // Z istniejących typów
import { Unavailability } from './unavailabilities'; // Z istniejących typów

// Typ rozróżniający źródło wydarzenia
export enum CalendarEventType {
  BOOKING = 'BOOKING',
  UNAVAILABILITY = 'UNAVAILABILITY',
}

// Ujednolicony interfejs dla FullCalendar
export interface CalendarEvent {
  id: string;
  title: string;       // Np. "Trening: Jan K." lub "Niedostępny"
  start: string;       // ISO String
  end: string;         // ISO String
  backgroundColor: string; // Np. blue-500 dla rezerwacji, gray-400 dla niedostępności
  borderColor: string;
  editable: boolean;   // false dla BOOKING, true dla UNAVAILABILITY
  extendedProps: {
    type: CalendarEventType;
    originalId: string; // ID z bazy danych (booking.id lub unavailability.id)
    description?: string;
  };
}

// Typy pomocnicze dla propsów modala
export interface UnavailabilityFormData {
  startTime: string; // ISO String dla inputów datetime-local
  endTime: string;
}
```

## 6. Zarządzanie stanem

Rekomendowane jest utworzenie composable `src/composables/useTrainerCalendar.ts`:

- **Stan:**
  - `events`: `Ref<CalendarEvent[]>`
  - `isLoading`: `Ref<boolean>`
- **Metody:**
  - `fetchEvents(range: { start: Date, end: Date })`:
    - Pobiera rezerwacje (`GET /bookings` z filtrem statusu `ACCEPTED`).
    - Pobiera niedostępności (`GET /unavailabilities` z parametrami `from`, `to`).
    - Łączy wyniki i mapuje na `CalendarEvent[]`.
  - `addUnavailability(data: CreateUnavailabilityDto)`: Wywołuje `POST /unavailabilities` i odświeża listę.
  - `updateUnavailability(id: string, data: UpdateUnavailabilityDto)`: Wywołuje `PATCH`.
  - `removeUnavailability(id: string)`: Wywołuje `DELETE`.

## 7. Integracja API

Wykorzystanie `axios` (lub skonfigurowanej instancji `apiClient`).

1.  **Pobieranie danych:**
    -   **Żądanie 1:** `GET /bookings?role=trainer&status=ACCEPTED&limit=100` (Uwaga: ze względu na brak filtrowania po dacie w API bookings, pobieramy limit i filtrujemy po stronie klienta lub prosimy o rozszerzenie API. Na potrzeby planu zakładamy pobranie aktywnych).
    -   **Żądanie 2:** `GET /unavailabilities?from={startISO}&to={endISO}`.
2.  **Tworzenie niedostępności:**
    -   **Endpoint:** `POST /unavailabilities`
    -   **Body:** `{ startTime: string, endTime: string, trainerId: string }`
3.  **Aktualizacja (Drag & Drop / Modal):**
    -   **Endpoint:** `PATCH /unavailabilities/:id`
    -   **Body:** `{ startTime?: string, endTime?: string }`
4.  **Usuwanie:**
    -   **Endpoint:** `DELETE /unavailabilities/:id`

## 8. Interakcje użytkownika

1.  **Przeglądanie grafiku:** Użytkownik widzi kolorowe bloki. Niebieskie = Rezerwacje (stałe), Szare = Niedostępności (edytowalne).
2.  **Dodawanie niedostępności (Szybkie):**
    - Użytkownik klika i przeciąga kursorem po pustych polach w widoku tygodniowym.
    - Otwiera się modal z wypełnionymi godzinami.
    - Użytkownik klika "Zapisz".
    - Nowy szary blok pojawia się w kalendarzu.
3.  **Edycja czasu (Drag & Drop):**
    - Użytkownik chwyta szary blok niedostępności i przesuwa go na inny dzień/godzinę.
    - Po upuszczeniu następuje strzał do API. W przypadku błędu (np. konflikt), blok wraca na miejsce.
4.  **Szczegóły/Usuwanie:**
    - Kliknięcie w szary blok otwiera modal.
    - Użytkownik może zmienić godziny ręcznie lub kliknąć "Usuń".

## 9. Warunki i walidacja

1.  **Walidacja formularza:**
    - `startTime` i `endTime` są wymagane.
    - `endTime` > `startTime`.
2.  **Walidacja biznesowa (Backend -> Frontend feedback):**
    - Konflikt terminów: Jeśli tworzona/przesuwana niedostępność nakłada się na istniejącą rezerwację, API zwróci błąd `409 Conflict`. Aplikacja musi wyświetlić odpowiedni komunikat (Toast) i cofnąć zmianę w UI.
3.  **Ograniczenia UI:**
    - Zdarzenia typu `BOOKING` mają ustawione `editable: false` w FullCalendar, co uniemożliwia ich przesuwanie przez interfejs.

## 10. Obsługa błędów

- **Błąd pobierania:** Wyświetlenie komunikatu "Nie udało się załadować kalendarza" i przycisk "Spróbuj ponownie".
- **Błąd zapisu (400/409):** Toast z treścią błędu (np. "Wybrany termin koliduje z inną rezerwacją"). Formularz pozostaje otwarty.
- **Błąd sieci:** Globalny handler błędów axios powinien wyłapać 500/Network Error.

## 11. Kroki implementacji

1.  **Setup biblioteki:** Zainstaluj `@fullcalendar/vue3`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`.
2.  **Typy i Serwisy:**
    - Utwórz typy w `src/types/calendar.ts`.
    - Zaktualizuj/Utwórz serwisy `bookingService` i `unavailabilityService` z metodami API.
3.  **Composable:** Zaimplementuj `useTrainerCalendar` z logiką pobierania i mapowania danych.
4.  **Komponent Wrapper:** Stwórz `FullCalendarWrapper.vue` z podstawową konfiguracją widoku (week/day, locale pl, slotDuration: '00:15:00').
5.  **Modal:** Zaimplementuj `UnavailabilityModal.vue` używając komponentów shadcn-vue.
6.  **Integracja widoku:** W `CalendarView.vue` połącz wrapper, modal i composable.
7.  **Obsługa zdarzeń:** Dodaj logikę `select` (otwieranie modala), `eventClick` (edycja) i `eventDrop` (aktualizacja).
8.  **Testy manualne:** Sprawdź scenariusze konfliktów, poprawność dat i stref czasowych oraz blokadę edycji rezerwacji.

