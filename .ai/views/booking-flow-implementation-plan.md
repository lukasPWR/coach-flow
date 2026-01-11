# Plan implementacji procesu rezerwacji na Profilu Trenera

## 1. Przegląd

Celem jest rozszerzenie istniejącego widoku `TrainerProfileView` o funkcjonalność składania rezerwacji (User Story US-009). Obecnie widok służy tylko do prezentacji danych.
Należy zintegrować listę usług z panelem dostępności (`TrainerAvailabilityWidget`), umożliwiając użytkownikowi wybór usługi, terminu i finalizację rezerwacji.

## 2. Istniejące pliki do modyfikacji

- `frontend/src/views/TrainerProfileView.vue` (Widok główny - koordynator)
- `frontend/src/components/trainers/profile/TrainerServicesList.vue` (Wybór usługi)
- `frontend/src/components/trainers/profile/TrainerAvailabilityWidget.vue` (Wybór terminu i rezerwacja)
- `frontend/src/types/trainer.ts` (Aktualizacja typów)
- `frontend/src/lib/api/booking.ts` (Nowy serwis API)

## 3. Szczegóły zmian w komponentach

### A. `TrainerServicesList.vue`

**Zmiany:**

- Dodanie przycisku "Wybierz" (lub "Rezerwuj") przy każdej usłudze.
- Wizualne wyróżnienie wybranej usługi (np. ramka, kolor tła).
- Obsługa propa `selectedServiceId`.

**Props:**

- `services: TrainerServiceViewModel[]` (istniejące)
- `selectedServiceId: string | null` (nowe)

**Events:**

- `select(service: TrainerServiceViewModel)`: Emitowane po kliknięciu.

### B. `TrainerAvailabilityWidget.vue`

To będzie główny komponent logiczny ("Smart Component") procesu.

**Zmiany:**

- **Props:** Dodanie `selectedService: TrainerServiceViewModel | null`.
- **Stan:**
  - Jeśli usługa nie jest wybrana: Wyświetla zachętę "Wybierz usługę z listy, aby sprawdzić dostępne terminy".
  - Jeśli usługa jest wybrana: Wyświetla kalendarz.
  - Generowanie slotów czasowych na podstawie:
    a) Czasu trwania usługi (`selectedService.durationMinutes`).
    b) Pobranych danych o dostępności (mockowane lub z endpointu jeśli dostępny).
- **Interakcja:** Wybór godziny -> Przycisk "Potwierdź rezerwację".
- **API:** Wywołanie `POST /bookings`.

### C. `TrainerProfileView.vue`

**Rola:** Zarządzanie stanem wyboru.

**Zmiany:**

- Dodanie stanu `selectedService` (ref).
- Przekazywanie `selectedService` do `TrainerAvailabilityWidget`.
- Obsługa zdarzenia `@select` z `TrainerServicesList`.
- (Opcjonalnie) Automatyczne przewijanie do widgetu na mobile po wybraniu usługi.

## 4. Wymagane Typy (TypeScript)

W `frontend/src/types/booking.ts` (lub podobnym):

```typescript
export interface CreateBookingRequest {
  trainerId: string
  serviceId: string
  startTime: string // ISO 8601
}

export interface BookingResponse {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  // ... inne pola
}
```

Dodatkowo, dla logiki kalendarza (wewnątrz komponentu lub w `types/calendar.ts`):

```typescript
export interface TimeSlot {
  start: Date
  end: Date
  isAvailable: boolean
}
```

## 5. Integracja API

### 1. Tworzenie rezerwacji

- **Endpoint:** `POST /bookings`
- **Wymagania:** Header `Authorization: Bearer <token>`
- **Body:** `{ trainerId, serviceId, startTime }`
- **Obsługa błędów:**
  - 401: Przekierowanie do logowania (z zachowaniem stanu `redirect=/trainer/:id`).
  - 400: Komunikat "Termin już zajęty".

### 2. Pobieranie dostępności

Zgodnie z obecnym API, brakuje publicznego endpointu `GET /public/availability`.
**Strategia wdrożenia:**

1.  W `TrainerAvailabilityWidget` wywołać symulowany fetch lub endpoint `/trainers/:id/unavailabilities` (jeśli backend pozwoli).
2.  Zaimplementować logikę klienta: generowanie slotów co 15/30 min w godzinach pracy (np. 8-20).
3.  Filtrowanie slotów "zajętych" na podstawie odpowiedzi API (jeśli dostępna) lub optymistyczne podejście (tylko walidacja przy POST). **Rekomendacja:** Dla lepszego UX, spróbować pobrać chociaż 'unavailabilities' trenera, jeśli endpoint na to pozwala (nawet jeśli wymaga auth, to dla zalogowanego klienta).

## 6. Scenariusz Użytkownika (Booking Flow)

1.  Klient wchodzi na profil `/trainer/123`.
2.  Klient klika "Wybierz" przy usłudze "Trening Personalny (60 min)".
3.  Lista usług podświetla wybór.
4.  Widget po prawej stronie odblokowuje kalendarz.
5.  Klient klika datę w kalendarzu.
6.  Widget wyświetla listę godzin (slotów).
7.  Klient klika "14:00".
8.  Pojawia się przycisk "Zarezerwuj wizytę".
9.  Klient klika.
    - _Check:_ Czy zalogowany? Nie -> Redirect do login -> Powrót.
    - Tak -> Strzał API.
10. Sukces -> Toast "Wniosek wysłany" + przekierowanie na Dashboard.

## 7. Kroki Implementacji

1.  **Typy i API:**

    - Utworzenie funkcji `createBooking` w `lib/api`.
    - Definicja typów request/response.

2.  **`TrainerServicesList.vue`:**

    - Dodanie przycisków "Wybierz".
    - Obsługa v-model lub props/emit dla selekcji.

3.  **`TrainerProfileView.vue`:**

    - Podpięcie stanu `selectedService`.

4.  **`TrainerAvailabilityWidget.vue` (Największa praca):**

    - Dodanie logiki wyświetlania "Wybierz usługę" (Empty State).
    - Implementacja generowania slotów czasowych (np. funkcja `generateTimeSlots(date, duration)`).
    - Implementacja wyboru slotu.
    - Implementacja wywołania `createBooking`.
    - Obsługa feedbacku (loading, success, error).

5.  **Walidacja Auth:**
    - Użycie `authStore` do sprawdzenia czy user jest zalogowany przed wysłaniem requestu.

## 8. Wyzwania i rozwiązania

- **Brak pełnych danych o dostępności:** Będziemy zakładać domyślne godziny pracy (np. 08:00 - 20:00) i wyświetlać wszystkie sloty jako dostępne, chyba że mamy dane o niedostępności. Błąd przy POST obsłuży ewentualne konflikty z istniejącymi rezerwacjami (których nie widzimy).
- **UX na mobile:** Na telefonie widget jest pod listą usług. Po wyborze usługi trzeba "scrollować" użytkownika do widgetu, żeby wiedział co dalej robić.
