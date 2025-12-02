# API Endpoint Implementation Plan: GET /bookings/:id

## 1. Przegląd punktu końcowego

Endpoint GET /bookings/:id umożliwia pobranie szczegółowych informacji o pojedynczej rezerwacji. Jest dostępny dla uwierzytelnionych użytkowników, którzy muszą być klientem lub trenerem powiązanym z daną rezerwacją. Celem jest zapewnienie dostępu do danych rezerwacji w celu wyświetlania statusu, szczegółów usługi i powiązanych informacji, bez modyfikacji danych. Endpoint integruje się z modułem bookings w NestJS, korzystając z TypeORM do interakcji z bazą PostgreSQL.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/bookings/:id` (gdzie `:id` to UUID rezerwacji)
- Parametry:
  - Wymagane: `id` (string, UUID v4) – identyfikator rezerwacji do pobrania
  - Opcjonalne: Brak
- Request Body: Brak (nie dotyczy dla GET)

## 3. Wykorzystywane typy

- DTO wejściowe: Brak body; walidacja parametru `id` za pomocą `ParseUUIDPipe` z class-validator.
- DTO wyjściowe: `BookingResponseDto` (oparty na `booking.interface.ts` z modułu bookings):
  ```typescript
  import { BookingStatus } from '../interfaces/booking-status.enum';
  import { ApiProperty } from '@nestjs/swagger';

  export class BookingResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty()
    trainerId: string;

    @ApiProperty()
    serviceId: string;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;

    @ApiProperty({ nullable: true })
    reminderSentAt?: Date;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    // Opcjonalne relacje (eager load w query)
    @ApiProperty({ type: 'string', nullable: true })
    clientName?: string;

    @ApiProperty({ type: 'string', nullable: true })
    trainerName?: string;

    @ApiProperty({ type: 'number', nullable: true })
    servicePrice?: number;
  }
  ```
- Command Modele: W `BookingsService` – metoda `async getBookingById(id: string, currentUserId: string): Promise<BookingResponseDto>`. Używać interfejsu `Booking` dla typowania encji wewnętrznej.

## 4. Szczegóły odpowiedzi

- Oczekiwana struktura odpowiedzi: JSON z instancją `BookingResponseDto`, w tym podstawowe pola rezerwacji i opcjonalne relacje (client name, trainer name, service price) dla pełnego kontekstu.
- Kody statusu:
  - 200 OK: Sukces, zwraca `BookingResponseDto`.
  - 400 Bad Request: Nieprawidłowy format `id` (np. nie UUID).
  - 401 Unauthorized: Brak ważnego tokenu JWT.
  - 403 Forbidden: Użytkownik nie ma dostępu do tej rezerwacji.
  - 404 Not Found: Rezerwacja nie istnieje.
  - 500 Internal Server Error: Błąd serwera (np. problem z DB).

Przykład odpowiedzi sukcesu:
```json
{
  "id": "uuid-rezerwacji",
  "clientId": "uuid-klienta",
  "trainerId": "uuid-trenera",
  "serviceId": "uuid-uslugi",
  "startTime": "2025-12-03T10:00:00Z",
  "endTime": "2025-12-03T11:00:00Z",
  "status": "PENDING",
  "reminderSentAt": null,
  "createdAt": "2025-12-02T12:00:00Z",
  "updatedAt": "2025-12-02T12:00:00Z",
  "clientName": "Jan Kowalski",
  "trainerName": "Anna Nowak",
  "servicePrice": 150.00
}
```

## 5. Przepływ danych

1. Request trafia do `BookingsController` (metoda `@Get(':id')`).
2. Walidacja `id` via `ParseUUIDPipe`.
3. AuthGuard (JWT) pobiera `currentUserId` z tokenu.
4. Controller injectuje `BookingsService` i wywołuje `getBookingById(id, currentUserId)`.
5. W service:
   - Użyć TypeORM Repository: `findOne({ where: { id, deletedAt: IsNull() }, relations: ['client', 'trainer', 'service'] })`.
   - Jeśli nie znaleziono: throw `NotFoundException`.
   - Sprawdź permissions: `if (booking.clientId !== currentUserId && booking.trainerId !== currentUserId) throw ForbiddenException`.
   - Mapuj encję na `BookingResponseDto` (użyć class-transformer dla exclude sensitive fields).
6. Response: Zwróć DTO via `@nestjs/swagger` z `@ApiResponse({ status: 200, type: BookingResponseDto })`.
Interakcje zewnętrzne: Tylko DB (PostgreSQL via TypeORM); brak zewnętrznych API.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Wymagany JWT token via `@UseGuards(AuthGuard('jwt'))` w controller.
- Autoryzacja: Custom check w service na podstawie `clientId` lub `trainerId` vs `currentUserId`; użyć `@Roles()` decorator jeśli role-based (np. CLIENT/TRAINER).
- Walidacja danych: `ParseUUIDPipe` dla `id`; global `ValidationPipe` dla transform i whitelist.
- Ochrona: Helmet dla security headers; CORS z explicit origins (np. frontend domain). Brak body, więc brak injection risk. Rate limiting via ThrottlerGuard dla /bookings.
- Dane wrażliwe: Response DTO wyklucza hasła/full user details; użyj `@Exclude()` z class-transformer.

## 7. Obsługa błędów

- 400 Bad Request: Walidacja `id` (np. "Invalid UUID") – throw `BadRequestException`.
- 401 Unauthorized: Brak tokenu lub invalid – obsługiwane przez AuthGuard.
- 403 Forbidden: Brak permissions – throw `ForbiddenException('Access denied to this booking')`.
- 404 Not Found: Rezerwacja nie istnieje – throw `NotFoundException('Booking not found')`.
- 500 Internal Server Error: Błędy DB lub nieobsłużone – global HttpExceptionFilter loguje via NestJS Logger z context (userId, id, timestamp).
Używać custom exceptions z @nestjs/common; logować tylko non-sensitive info. Testować edge cases: invalid id, unauthorized user, deleted booking.

## 8. Etapy wdrożenia

1. Zaktualizuj `BookingsController` (backend/src/bookings/bookings.controller.ts): Dodaj metodę `@Get(':id') getBooking(@Param('id', ParseUUIDPipe) id: string, @Req() req: any)`; inject service, call `getBookingById(id, req.user.sub)`, return response z `@ApiOperation` i `@ApiResponse`.
2. Zaktualizuj `BookingsService` (backend/src/bookings/bookings.service.ts): Dodaj metodę `getBookingById` z TypeORM query, permissions check, mapping do DTO; inject `Repository<Booking>`.
3. Utwórz/aktualizuj `BookingResponseDto` w `dto/` z walidacją i Swagger decorators.
4. Dodaj guards: Upewnij się, że `@UseGuards(AuthGuard('jwt'))` na controller; opcjonalnie custom `BookingsGuard` dla permissions.
5. Walidacja i config: Upewnij się, że global ValidationPipe i ConfigModule są skonfigurowane; dodaj Swagger docs via `@ApiTags('Bookings')`.
6. Testy: Napisz unit testy dla service (mock repo, test permissions); e2e testy dla endpoint (Supertest z JWT, check status codes).
7. Optymalizacja: Dodaj index na `bookings.id` jeśli brak; eager load relations tylko potrzebne pola.
8. Dokumentacja: Zaktualizuj OpenAPI via @nestjs/swagger; przetestuj endpoint w Swagger UI.
