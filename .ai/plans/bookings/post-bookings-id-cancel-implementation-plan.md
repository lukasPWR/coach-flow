# API Endpoint Implementation Plan: POST /bookings/:id/cancel

## 1. Przegląd punktu końcowego

Endpoint umożliwia uwierzytelnionemu użytkownikowi (klientowi lub trenerowi) anulowanie zaakceptowanej rezerwacji. Po anulowaniu status rezerwacji zmienia się na CANCELLED, a w przypadku anulowania przez klienta mniej niż 12 godzin przed rozpoczęciem, tworzona jest blokada rezerwacji (booking_ban) dla tego klienta wobec trenera.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: `/bookings/:id/cancel`
- Parametry:
  - Wymagane: `id` (UUID rezerwacji, walidowane jako UUID v4)
  - Opcjonalne: Brak
- Request Body: Pusty (brak wymaganych danych wejściowych; opcjonalnie prosty DTO bez pól dla semantyki)

## 3. Wykorzystywane typy

- **DTOs i Command Modele:**
  - `UpdateBookingDto` (z modułu bookings/dto/update-booking.dto.ts): Opcjonalne pole `status: BookingStatus` do ustawienia na CANCELLED (choć dla tego endpointu może być minimalne lub pominięte).
  - `CreateBookingBanDto` (z modułu booking-bans/dto/create-booking-ban.dto.ts): Do tworzenia blokady – pola: `clientId: string` (UUID), `trainerId: string` (UUID), `bannedUntil: Date` (ISO string, np. 7 dni od teraz).
- **Enums i Interfaces:**
  - `BookingStatus` enum (z bookings/interfaces/booking-status.enum.ts): Użyj `CANCELLED`.
  - `BookingInterface` (z bookings/interfaces/booking.interface.ts): Do reprezentacji zaktualizowanej rezerwacji w odpowiedzi.

## 4. Szczegóły odpowiedzi

- Sukces: `200 OK` z ciałem odpowiedzi zawierającym zaktualizowany obiekt rezerwacji (`BookingInterface`) ze statusem `CANCELLED`.
- Struktura odpowiedzi:
  ```json
  {
    "id": "uuid",
    "clientId": "uuid",
    "trainerId": "uuid",
    "serviceId": "uuid",
    "startTime": "ISO DateTime",
    "endTime": "ISO DateTime",
    "status": "CANCELLED",
    "reminderSentAt": null,
    "createdAt": "ISO DateTime",
    "updatedAt": "ISO DateTime"
  }
  ```
- Błędy: Standardowe NestJS odpowiedzi z message i opcjonalnie details (np. via @nestjs/swagger).

## 5. Przepływ danych

1. Controller odbiera żądanie z path param `id` i currentUserId z JWT.
2. Wywołaj `BookingsService.cancelBooking(bookingId, currentUserId)`.
3. W serwisie:
   - Pobierz rezerwację z bazy (TypeORM Repository<BookingEntity>, filtruj po ID i nieusunięte).
   - Sprawdź, czy status to ACCEPTED i czy startTime > now() + 12h dla late cancel logiki.
   - Zweryfikuj, czy currentUserId == clientId lub trainerId.
   - Ustaw status na CANCELLED, zaktualizuj updatedAt.
   - Jeśli klient i <12h przed startTime: Oblicz bannedUntil (np. now() + 7 dni), utwórz wpis w `booking_bans` via injected BookingBansService.
   - Zapisz zmiany w DB (transaction dla atomiczności: update booking + insert ban).
4. Zwróć zaktualizowaną rezerwację (bez hashy/hasłów).
5. Interakcje zewnętrzne: Brak (tylko DB via TypeORM); log errors jeśli failure.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Wymagany JWT AuthGuard (@UseGuards(AuthGuard('jwt'))).
- Autoryzacja: W serwisie sprawdź ownership (clientId lub trainerId == currentUserId); opcjonalnie custom Guard dla roli (TRAINER/CLIENT).
- Walidacja danych: @Param('id', ParseUUIDPipe) lub @IsUUID() w controller; global ValidationPipe (whitelist: true, transform: true).
- Ochrona: Helmet dla headers, CORS z explicit origins; rate limiting na endpoint (nestjs/throttler); unikaj SQL injection via TypeORM.
- Dane wrażliwe: Nie zwracaj password_hash; używaj soft delete dla bookings jeśli potrzeba.

## 7. Obsługa błędów

- 400 Bad Request: Nieprawidłowy UUID w `id`.
- 401 Unauthorized: Brak lub nieważny token JWT.
- 403 Forbidden: Użytkownik nie jest właścicielem rezerwacji (nie client/trainer).
- 404 Not Found: Rezerwacja nie istnieje lub usunięta (soft delete).
- 409 Conflict: Rezerwacja nie w statusie ACCEPTED, już rozpoczęta, lub konflikt z banem/niedostępnością.
- 500 Internal Server Error: Błąd DB (np. transaction fail), wyjątek w ban creation; loguj z kontekstem (userId, bookingId) via Logger.
- Użyj NestJS exceptions: throw NotFoundException, ForbiddenException, ConflictException; global filter dla konsystencji.

## 8. Rozważania dotyczące wydajności

- Wąskie gardła: Query do bookings (indeks na id, client_id, trainer_id, start_time z db-plan.md); dla ban check – query z indeksem na client_trainer.
- Optymalizacja: Użyj transaction dla update+insert; cache services jeśli często (Redis? ale nie w stacku); limituj wyniki do single entity.
- Skalowalność: Single row ops, niskie obciążenie; monitoruj z Prometheus jeśli dodane.
- Testy: Unit dla service (mock repo), e2e dla endpoint z DB isolation.

## 9. Etapy wdrożenia

1. Utwórz lub zaktualizuj `bookings.controller.ts`: Dodaj @Post(':id/cancel') z @UseGuards(AuthGuard('jwt')), pobierz user z request, waliduj param @Param('id', ParseUUIDPipe), wywołaj service, zwróć response z @Swagger.
2. W `bookings.service.ts`: Dodaj metodę cancelBooking – inject BookingRepository i BookingBansService; fetch, validate, update status, conditional ban creation (bannedUntil = new Date(now + 7*24*60*60*1000)), save w transaction (@Transaction()).
3. W `booking-bans.service.ts`: Użyj existing create method z CreateBookingBanDto.
4. Dodaj DTO jeśli potrzeba: Minimalny CancelBookingDto (pusty) w dto/.
5. Walidacja: Dodaj custom pipe/guard dla ownership check.
6. Dokumentacja: @ApiOperation, @ApiResponse dla status codes w controller.
7. Testy: Unit test service (jest, success, errors); e2e test endpoint (supertest z auth token).
8. Optymalizacja: Dodaj indeksy jeśli brak (z db-plan.md); lint i build check.
