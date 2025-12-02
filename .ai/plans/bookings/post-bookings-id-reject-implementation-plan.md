# API Endpoint Implementation Plan: Reject Booking

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /bookings/:id/reject` umożliwia trenerom odrzucanie oczekujących rezerwacji. Po odrzuceniu, status rezerwacji zmienia się na `REJECTED`, co zwalnia termin w kalendarzu (chociaż rezerwacje odrzucone nadal mogą być widoczne w historii). Operacja jest dostępna wyłącznie dla użytkowników z rolą `TRAINER` i dotyczy tylko rezerwacji przypisanych do danego trenera.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/bookings/:id/reject`
- **Parametry**:
  - **Wymagane**:
    - `id` (Path Parameter): Unikalny identyfikator UUID rezerwacji do odrzucenia.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak (operacja zmienia jedynie status).

## 3. Wykorzystywane typy

- **Entities**: `Booking` (`backend/src/bookings/entities/booking.entity.ts`)
- **Enums**: `BookingStatus` (`backend/src/bookings/interfaces/booking-status.enum.ts`), `UserRole` (`backend/src/users/interfaces/user-role.enum.ts`)
- **Pipes**: `ParseUUIDPipe` (wbudowany w NestJS)

## 4. Szczegóły odpowiedzi

- **Kod statusu sukcesu**: `200 OK`
- **Ciało odpowiedzi**: Zaktualizowany obiekt rezerwacji.

```json
{
  "id": "uuid-rezerwacji",
  "clientId": "uuid-klienta",
  "trainerId": "uuid-trenera",
  "serviceId": "uuid-uslugi",
  "startTime": "2023-11-15T14:00:00.000Z",
  "endTime": "2023-11-15T15:00:00.000Z",
  "status": "REJECTED",
  "createdAt": "2023-11-10T10:00:00.000Z",
  "updatedAt": "2023-11-10T12:30:00.000Z"
}
```

## 5. Przepływ danych

1.  **Controller**: Odbiera żądanie `POST`, waliduje token JWT oraz rolę użytkownika (`TRAINER`), a także format parametru `id` (UUID).
2.  **Service**:
    - Pobiera rezerwację z bazy danych na podstawie `id`.
    - Sprawdza, czy rezerwacja istnieje.
    - Weryfikuje, czy `trainerId` rezerwacji zgadza się z ID zalogowanego użytkownika.
    - Sprawdza, czy obecny status rezerwacji to `PENDING`.
    - Zmienia status na `REJECTED`.
    - Zapisuje zmiany w bazie danych.
3.  **Database**: Aktualizuje rekord w tabeli `bookings`.
4.  **Response**: Zwraca zaktualizowaną encję do kontrolera, a następnie do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany poprawny token JWT (Bearer).
- **Autoryzacja RBAC**: Dostęp ograniczony dekoratorem `@Roles(UserRole.TRAINER)`.
- **Weryfikacja własności**: Serwis musi upewnić się, że trener próbuje odrzucić rezerwację przypisaną do niego, a nie do innego trenera. W przypadku próby dostępu do cudzej rezerwacji, należy zwrócić błąd `404 Not Found` (aby nie ujawniać istnienia zasobu).

## 7. Obsługa błędów

| Scenariusz                             | Kod HTTP                  | Komunikat błędu                                     |
| :------------------------------------- | :------------------------ | :-------------------------------------------------- |
| Nieprawidłowy format ID                | 400 Bad Request           | `Validation failed (uuid is expected)`              |
| Brak tokenu / Nieprawidłowy token      | 401 Unauthorized          | `Unauthorized`                                      |
| Użytkownik nie jest trenerem           | 403 Forbidden             | `Access denied. Required roles: TRAINER`            |
| Rezerwacja nie istnieje                | 404 Not Found             | `Booking not found`                                 |
| Rezerwacja należy do innego trenera    | 404 Not Found             | `Booking not found`                                 |
| Rezerwacja nie jest w statusie PENDING | 409 Conflict              | `Booking is not in PENDING status`                  |
| Błąd bazy danych                       | 500 Internal Server Error | `Failed to reject booking. Please try again later.` |

## 8. Rozważania dotyczące wydajności

- Operacja odbywa się na kluczu głównym (`id`), co zapewnia szybkie wyszukiwanie.
- Zmiana statusu jest lekką operacją aktualizacji pojedynczego rekordu.

## 9. Etapy wdrożenia

1.  **Modyfikacja Serwisu (`backend/src/bookings/bookings.service.ts`)**:

    - Dodać metodę `rejectBooking(bookingId: string, trainerId: string): Promise<Booking>`.
    - Zaimplementować logikę pobierania, weryfikacji własności, sprawdzania statusu i aktualizacji (analogicznie do `approveBooking`).

2.  **Modyfikacja Kontrolera (`backend/src/bookings/bookings.controller.ts`)**:

    - Dodać metodę obsługującą `POST :id/reject`.
    - Zastosować dekoratory Swaggera (`@ApiOperation`, `@ApiParam`, `@ApiOkResponse`, itp.).
    - Zastosować dekoratory bezpieczeństwa (`@Roles(UserRole.TRAINER)`).
    - Wywołać metodę serwisu.

3.  **Weryfikacja**:
    - Upewnić się, że endpoint poprawnie odrzuca rezerwacje `PENDING`.
    - Sprawdzić, czy blokuje próby odrzucenia rezerwacji w innych statusach (`ACCEPTED`, `REJECTED`, `CANCELLED`).
    - Sprawdzić, czy trener nie może odrzucić rezerwacji innego trenera.
