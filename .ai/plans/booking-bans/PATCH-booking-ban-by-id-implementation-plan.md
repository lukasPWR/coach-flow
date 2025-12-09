# API Endpoint Implementation Plan: PATCH /booking-bans/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy pozwala administratorom na częściową aktualizację istniejącej blokady rezerwacji, na przykład w celu przedłużenia lub skrócenia okresu jej obowiązywania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/booking-bans/:id`
- **Parametry Ścieżki (Path Parameters)**:
  - `id` (wymagany, `UUID`): Identyfikator blokady do aktualizacji.
- **Request Body**:
  ```json
  {
    "bannedUntil": "ISO_Date_String"
  }
  ```
- **Parametry Ciała Żądania**:
  - `bannedUntil` (opcjonalny, `string`): Nowa data wygaśnięcia blokady. Musi być datą w przyszłości.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `UpdateBookingBanDto`: DTO dla ciała żądania, umożliwiające częściową aktualizację.
    ```typescript
    import { IsDateString, IsOptional } from 'class-validator';

    export class UpdateBookingBanDto {
      @IsOptional()
      @IsDateString()
      readonly bannedUntil?: string;
    }
    ```
  - `BookingBanResponseDto`: Standardowy DTO odpowiedzi, zawierający pełne dane zaktualizowanej blokady, w tym powiązane obiekty użytkowników.

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca kompletny, zaktualizowany obiekt blokady.
  ```json
  {
    "id": "c1d2e3f4-...",
    "bannedUntil": "2024-02-01T00:00:00.000Z",
    "client": { "id": "...", "name": "...", "email": "..." },
    "trainer": { "id": "...", "name": "...", "email": "..." },
    "createdAt": "...",
    "updatedAt": "..." 
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Administrator wysyła żądanie `PATCH` na `/booking-bans/some-uuid` z nową datą `bannedUntil` w ciele.
2.  `BookingBansController` odbiera żądanie.
3.  Uruchamiane są guardy (`JwtAuthGuard`, `RolesGuard('ADMIN')`).
4.  `ParseUUIDPipe` waliduje `:id`. `ValidationPipe` waliduje ciało żądania względem `UpdateBookingBanDto`.
5.  Kontroler wywołuje metodę `update(id, updateDto)` w `BookingBansService`.
6.  `BookingBansService`:
    - Wyszukuje blokadę o podanym `id`. Jeśli nie istnieje, rzuca `NotFoundException`.
    - Sprawdza, czy `updateDto.bannedUntil` jest datą w przyszłości. Jeśli nie, rzuca `BadRequestException`.
    - Aktualizuje pole `bannedUntil` w znalezionej encji.
    - Zapisuje zmiany w bazie danych.
    - Pobiera zaktualizowaną encję wraz z relacjami `client` i `trainer`.
    - Mapuje wynik na `BookingBanResponseDto`.
    - Zwraca zmapowany obiekt.
7.  Kontroler zwraca otrzymany DTO z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i Autoryzacja**: Dostęp jest ściśle kontrolowany przez `JwtAuthGuard` i `RolesGuard`.
- **Walidacja danych**: `ParseUUIDPipe` i `ValidationPipe` (`whitelist: true`) zapewniają, że tylko poprawne i dozwolone dane docierają do logiki biznesowej.
- **Zapobieganie masowej aktualizacji**: DTO zawiera tylko pole `bannedUntil`, co uniemożliwia przypadkową lub złośliwą modyfikację innych pól, takich jak `clientId` czy `trainerId`.

## 7. Obsługa błędów

- **`400 Bad Request`**:
  - `:id` nie jest prawidłowym UUID.
  - Ciało żądania zawiera nieprawidłowy format daty lub data `bannedUntil` jest w przeszłości.
- **`401 Unauthorized`**: Brak lub nieważny token JWT.
- **`403 Forbidden`**: Użytkownik nie ma uprawnień administratora.
- **`404 Not Found`**: Blokada o podanym `id` nie została znaleziona.
- **`500 Internal Server Error`**: Nieoczekiwany błąd po stronie serwera.

## 8. Rozważania dotyczące wydajności

- Operacja wymaga co najmniej dwóch interakcji z bazą danych: `SELECT` w celu znalezienia rekordu i `UPDATE` w celu jego zapisania. Są to szybkie operacje oparte na kluczu głównym.
- Nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **DTO**:
    - Utworzyć plik `src/booking-bans/dto/update-booking-ban.dto.ts` z zawartością opisaną powyżej.
2.  **Serwis (`BookingBansService`)**:
    - Zaimplementować metodę `async update(id: string, updateDto: UpdateBookingBanDto): Promise<BookingBanResponseDto>`.
    - Dodać logikę wyszukiwania (`findOneOrFail` lub `findOne` z rzucaniem `NotFoundException`).
    - Dodać walidację biznesową dla `bannedUntil`.
    - Zaimplementować logikę aktualizacji i zapisu.
    - Dodać logikę pobrania zaktualizowanego rekordu z relacjami i mapowania na DTO odpowiedzi.
3.  **Kontroler (`BookingBansController`)**:
    - Dodać metodę `update` dla `PATCH /booking-bans/:id`.
    - Użyć dekoratorów `@Patch(':id')`.
    - Zabezpieczyć metodę guardami i zwalidować parametry (`@Param`, `@Body`).
    - Dodać adnotacje Swagger (`@ApiOkResponse`, `@ApiBody`, etc.).
4.  **Testy**:
    - Napisać test jednostkowy dla `BookingBansService.update`, sprawdzający logikę aktualizacji, walidacji i obsługę błędu `404`.
    - Napisać test e2e dla endpointu, weryfikujący poprawną aktualizację, autoryzację i obsługę błędów `400`, `403`, `404`.
