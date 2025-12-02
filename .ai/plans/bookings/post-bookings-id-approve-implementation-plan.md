# API Endpoint Implementation Plan: Approve Booking

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia trenerom (rola `TRAINER`) akceptowanie oczekujących rezerwacji (`PENDING`). Operacja zmienia status rezerwacji na `ACCEPTED`, co potwierdza termin spotkania z klientem.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/bookings/:id/approve`
- **Parametry**:
  - **Wymagane**:
    - `id` (ścieżka): UUID rezerwacji do zaakceptowania.
  - **Opcjonalne**: Brak.
- **Request Body**: Puste.

## 3. Wykorzystywane typy

- **BookingStatus**: Enum (wartość docelowa: `ACCEPTED`).
- **Booking**: Encja zwracana w odpowiedzi.
- **Brak DTO wejściowego**: Żądanie nie wymaga ciała.

## 3. Szczegóły odpowiedzi

- **Sukces (200 OK)**: Zwraca zaktualizowany obiekt rezerwacji.
  ```json
  {
    "id": "uuid",
    "status": "ACCEPTED",
    "startTime": "...",
    ...
  }
  ```
- **Błędy**:
  - `400 Bad Request`: Nieprawidłowe ID (walidacja UUID).
  - `401 Unauthorized`: Brak lub nieprawidłowy token JWT.
  - `403 Forbidden`: Użytkownik nie ma roli `TRAINER`.
  - `404 Not Found`: Rezerwacja nie istnieje lub nie należy do zalogowanego trenera.
  - `409 Conflict`: Rezerwacja nie jest w stanie `PENDING` (np. już anulowana lub zaakceptowana).

## 4. Przepływ danych

1. **Controller**:
   - Odbiera żądanie `POST /bookings/:id/approve`.
   - Weryfikuje rolę użytkownika (`TRAINER`) przy użyciu `RolesGuard`.
   - Wyciąga `id` rezerwacji z URL i `user.id` z tokenu JWT.
   - Przekazuje dane do serwisu.
2. **Service**:
   - Pobiera rezerwację z bazy danych, filtrując po `id`.
   - Sprawdza, czy rezerwacja istnieje.
   - **Weryfikacja własności**: Sprawdza, czy `trainerId` rezerwacji zgadza się z ID zalogowanego trenera.
   - **Weryfikacja stanu**: Sprawdza, czy obecny status to `PENDING`. Jeśli nie, rzuca wyjątek `ConflictException`.
   - Aktualizuje status na `ACCEPTED`.
   - Zapisuje zmiany w bazie danych.
3. **Response**:
   - Zwraca zaktualizowaną encję do kontrolera, a następnie do klienta.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany token JWT (`JwtAuthGuard`).
- **Autoryzacja RBAC**: Tylko użytkownicy z rolą `TRAINER` (`RolesGuard`).
- **Weryfikacja własności (Resource Ownership)**: Krytyczne jest sprawdzenie, czy trener akceptuje **swoją** rezerwację. Próba akceptacji rezerwacji innego trenera powinna skutkować błędem (najlepiej 404, aby nie ujawniać istnienia zasobu, lub 403).

## 6. Obsługa błędów

- **NotFoundException**: Gdy rezerwacja o podanym ID nie zostanie znaleziona (lub nie należy do trenera).
- **ConflictException**: Gdy próba zmiany statusu dotyczy rezerwacji, która nie jest `PENDING` (wiadomość: "Booking is not in PENDING status").
- **BadRequestException**: Walidacja `ParseUUIDPipe` dla parametru ID.

## 7. Rozważania dotyczące wydajności

- Pobranie rezerwacji odbywa się po kluczu głównym (`id`), co jest szybkie.
- Operacja jest atomową aktualizacją jednego rekordu.
- Należy upewnić się, że zapytanie do bazy zawiera tylko niezbędne relacje (jeśli w ogóle są potrzebne do zwrócenia odpowiedzi), choć w tym przypadku wystarczy sama encja rezerwacji.

## 8. Etapy wdrożenia

1. **Weryfikacja Enuma**:

   - Sprawdź `backend/src/bookings/entities/booking.entity.ts`.
   - Upewnij się, że enum `BookingStatus` w encji jest zgodny z `backend/src/bookings/interfaces/booking-status.enum.ts` i zawiera wartość `ACCEPTED`. Jeśli encja definiuje własny enum z wartością `CONFIRMED` zamiast `ACCEPTED`, należy to ujednolicić (zmienić na `ACCEPTED` zgodnie ze specyfikacją API).

2. **Implementacja Service**:

   - W `BookingsService` dodaj metodę `approveBooking(bookingId: string, trainerId: string): Promise<Booking>`.
   - Zaimplementuj logikę pobierania, sprawdzania warunków (własność, status PENDING) i aktualizacji.

3. **Implementacja Controller**:

   - W `BookingsController` dodaj metodę dla endpointu `POST :id/approve`.
   - Użyj dekoratorów `@Post(':id/approve')`, `@Roles(UserRole.TRAINER)`, `@HttpCode(HttpStatus.OK)`.
   - Dodaj dokumentację Swagger (`@ApiOperation`, `@ApiResponse`).
   - Wywołaj metodę serwisu.

4. **Weryfikacja Manualna/Testy**:
   - Sprawdź działanie dla poprawnego scenariusza.
   - Sprawdź błędy: zły ID, rezerwacja innego trenera, rezerwacja już zaakceptowana.
