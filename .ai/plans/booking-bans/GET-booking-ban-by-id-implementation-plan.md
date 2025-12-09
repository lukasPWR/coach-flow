# API Endpoint Implementation Plan: GET /booking-bans/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia administratorowi pobranie szczegółowych informacji o pojedynczej blokadzie rezerwacji na podstawie jej unikalnego identyfikatora.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/booking-bans/:id`
- **Parametry Ścieżki (Path Parameters)**:
  - `id` (wymagany, `UUID`): Unikalny identyfikator blokady rezerwacji.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `BookingBanResponseDto`: Służy do strukturyzacji odpowiedzi. Zawiera dane blokady oraz zagnieżdżone podstawowe informacje o kliencie i trenerze.
    ```typescript
    class BasicUserResponseDto {
      id: string;
      name: string;
      email: string;
    }

    class BookingBanResponseDto {
      id: string;
      bannedUntil: Date;
      client: BasicUserResponseDto;
      trainer: BasicUserResponseDto;
      createdAt: Date;
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca obiekt znalezionej blokady rezerwacji.
  ```json
  {
    "id": "c1d2e3f4-g5h6-7890-1234-567890abcdef",
    "bannedUntil": "2024-01-01T00:00:00.000Z",
    "client": {
      "id": "a1b2c3d4-...",
      "name": "Jan Kowalski",
      "email": "jan.kowalski@example.com"
    },
    "trainer": {
      "id": "b1c2d3e4-...",
      "name": "Anna Nowak",
      "email": "anna.nowak@example.com"
    },
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Administrator wysyła żądanie `GET` na `/booking-bans/some-uuid`.
2.  `BookingBansController` odbiera żądanie.
3.  Uruchamiane są guardy: `JwtAuthGuard` (uwierzytelnianie) i `RolesGuard` (autoryzacja `ADMIN`).
4.  `ParseUUIDPipe` waliduje parametr `:id` z URL. Jeśli jest nieprawidłowy, zwraca `400 Bad Request`.
5.  Kontroler wywołuje metodę `findOne(id)` w `BookingBansService`.
6.  `BookingBansService`:
    - Używa repozytorium do wyszukania blokady (`findOne`) z opcją `relations: ['client', 'trainer']`.
    - Jeśli blokada nie zostanie znaleziona, rzuca `NotFoundException`, co skutkuje odpowiedzią `404 Not Found`.
    - Jeśli blokada zostanie znaleziona, mapuje encję na `BookingBanResponseDto`.
    - Zwraca zmapowany obiekt DTO do kontrolera.
7.  Kontroler zwraca otrzymany obiekt z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i Autoryzacja**: Endpoint musi być zabezpieczony przez `JwtAuthGuard` i `RolesGuard` (`ADMIN`), aby zapobiec dostępowi nieuprawnionych użytkowników.
- **Walidacja danych wejściowych**: Użycie `ParseUUIDPipe` zapewnia, że do warstwy serwisowej trafiają tylko poprawne identyfikatory UUID, chroniąc przed błędami i potencjalnymi atakami.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy `:id` w ścieżce URL nie jest prawidłowym formatem UUID.
- **`401 Unauthorized`**: Zwracany, gdy żądanie nie jest uwierzytelnione.
- **`403 Forbidden`**: Zwracany, gdy uwierzytelniony użytkownik nie ma roli `ADMIN`.
- **`404 Not Found`**: Zwracany, gdy w bazie danych nie istnieje blokada o podanym `id`.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera.

## 8. Rozważania dotyczące wydajności

- Zapytanie do bazy danych jest bardzo wydajne, ponieważ wyszukuje po kluczu głównym (`id`).
- Użycie `relations` (eager loading) jest optymalne, ponieważ pobiera wszystkie potrzebne dane w jednym zapytaniu, unikając problemu N+1.

## 9. Etapy wdrożenia

1.  **DTO**:
    - Upewnić się, że `BookingBanResponseDto` jest zdefiniowany i dostępny w module.
2.  **Serwis (`BookingBansService`)**:
    - Zaimplementować metodę `async findOne(id: string): Promise<BookingBanResponseDto>`.
    - Dodać logikę wyszukiwania rekordu za pomocą `this.repository.findOne({ where: { id }, relations: ['client', 'trainer'] })`.
    - Dodać obsługę przypadku, gdy rekord nie zostanie znaleziony (rzucenie `NotFoundException`).
    - Dodać logikę mapowania wyniku na `BookingBanResponseDto`.
3.  **Kontroler (`BookingBansController`)**:
    - Dodać metodę `findOne` dla `GET /booking-bans/:id`.
    - Użyć dekoratora `@Get(':id')`.
    - Zabezpieczyć metodę guardami `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles('ADMIN')`.
    - Użyć `ParseUUIDPipe` do walidacji parametru ID: `@Param('id', ParseUUIDPipe)`.
    - Dodać odpowiednie adnotacje Swagger (`@ApiOkResponse`, `@ApiNotFoundResponse`, etc.).
4.  **Testy**:
    - Napisać test jednostkowy dla `BookingBansService.findOne`, sprawdzający scenariusz sukcesu i scenariusz "not found".
    - Napisać test e2e dla endpointu, weryfikujący poprawną odpowiedź, autoryzację oraz obsługę błędów `400`, `403` i `404`.
