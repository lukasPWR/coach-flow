# API Endpoint Implementation Plan: GET /booking-bans

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia administratorom pobieranie paginowanej listy wszystkich blokad rezerwacji w systemie. Zwraca szczegółowe informacje o każdej blokadzie, w tym dane klienta i trenera, którego dotyczy.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/booking-bans`
- **Parametry Zapytania (Query Parameters)**:
  - `page` (opcjonalny, `number`): Numer strony wyników. Domyślnie: `1`.
  - `limit` (opcjonalny, `number`): Liczba wyników na stronie. Domyślnie: `10`, Maksymalnie: `100`.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `PaginationQueryDto`: Ogólny DTO do obsługi zapytań paginacji.
    ```typescript
    import { Type } from 'class-transformer';
    import { IsInt, IsOptional, Max, Min } from 'class-validator';

    export class PaginationQueryDto {
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      readonly page: number = 1;

      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(100)
      readonly limit: number = 10;
    }
    ```
  - `BookingBanResponseDto`: DTO dla pojedynczej blokady w odpowiedzi, zawierający zagnieżdżone dane użytkowników.
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
  - `PaginatedBookingBansResponseDto`: DTO dla całej paginowanej odpowiedzi.
    ```typescript
    import { PaginationMetaDto } from '../common/dto/pagination-meta.dto';

    class PaginatedBookingBansResponseDto {
      data: BookingBanResponseDto[];
      meta: PaginationMetaDto;
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca obiekt z danymi i metadanymi paginacji.
  ```json
  {
    "data": [
      {
        "id": "c1d2e3f4-...",
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
    ],
    "meta": {
      "totalItems": 1,
      "itemsPerPage": 10,
      "currentPage": 1,
      "totalPages": 1
    }
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Administrator wysyła żądanie `GET` na `/booking-bans`, opcjonalnie z parametrami `page` i `limit`.
2.  `BookingBansController` odbiera żądanie.
3.  Uruchamiane są guardy: `JwtAuthGuard` i `RolesGuard` (`ADMIN`).
4.  `ValidationPipe` waliduje parametry zapytania przy użyciu `PaginationQueryDto`.
5.  Kontroler wywołuje metodę `findAll()` w `BookingBansService`, przekazując DTO paginacji.
6.  `BookingBansService`:
    - Oblicza `skip` i `take` dla zapytania do bazy danych.
    - Wywołuje `repository.findAndCount()` z opcjami `skip`, `take` oraz `relations: ['client', 'trainer']`, aby za jednym zapytaniem pobrać blokady wraz z powiązanymi obiektami użytkowników.
    - Mapuje pobrane encje `BookingBan` na obiekty `BookingBanResponseDto`.
    - Tworzy i zwraca obiekt `PaginatedBookingBansResponseDto` z danymi i metadanymi.
7.  Kontroler zwraca otrzymany obiekt z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i Autoryzacja**: Endpoint jest chroniony przez `JwtAuthGuard` oraz `RolesGuard` z rolą `ADMIN`, co zapobiega nieautoryzowanemu dostępowi.
- **Ochrona przed DoS**: Walidacja w `PaginationQueryDto` (w szczególności `@Max(100)` dla `limit`) chroni system przed żądaniami, które mogłyby nadmiernie obciążyć bazę danych.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy parametry `page` lub `limit` są nieprawidłowe (np. nie są liczbami, są ujemne, `limit` jest za duży).
- **`401 Unauthorized`**: Zwracany, gdy żądanie nie zawiera prawidłowego tokenu JWT.
- **`403 Forbidden`**: Zwracany, gdy uwierzytelniony użytkownik nie posiada roli `ADMIN`.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych problemów po stronie serwera.

## 8. Rozważania dotyczące wydajności

- **Paginacja**: Kluczowy element zapewniający wydajność. Zapobiega pobieraniu wszystkich rekordów naraz.
- **Eager Loading**: Użycie opcji `relations` w zapytaniu `findAndCount` pozwala na pobranie powiązanych danych użytkowników w jednym, zoptymalizowanym zapytaniu (eager loading), co jest znacznie wydajniejsze niż pobieranie ich osobno dla każdego rekordu (lazy loading, N+1 problem).
- **Indeksy**: Wydajność zależy od istnienia indeksów na kluczach obcych (`clientId`, `trainerId`) w tabeli `booking_bans`.

## 9. Etapy wdrożenia

1.  **DTOs**:
    - Utworzyć lub zweryfikować istnienie `PaginationQueryDto` w `src/common/dto/`.
    - Utworzyć `BookingBanResponseDto` oraz `PaginatedBookingBansResponseDto` w `src/booking-bans/dto/`.
2.  **Serwis (`BookingBansService`)**:
    - Zaimplementować metodę `async findAll(query: PaginationQueryDto): Promise<PaginatedBookingBansResponseDto>`.
    - Dodać logikę paginacji (`skip`, `take`).
    - Wywołać `this.repository.findAndCount({ skip, take, relations: ['client', 'trainer'] })`.
    - Zaimplementować mapowanie wyników na DTO odpowiedzi.
    - Skonstruować i zwrócić finalny obiekt paginacji.
3.  **Kontroler (`BookingBansController`)**:
    - Dodać metodę `findAll` dla `GET /booking-bans`.
    - Zabezpieczyć ją guardami `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles('ADMIN')`.
    - Użyć dekoratora `@Query()` do przyjęcia i zwalidowania parametrów paginacji.
    - Dodać adnotacje Swagger (`@ApiOkResponse`, `@ApiQuery`, etc.).
4.  **Testy**:
    - Napisać testy jednostkowe dla `BookingBansService`, sprawdzające poprawność logiki paginacji i mapowania danych.
    - Napisać testy e2e dla endpointu, weryfikujące paginację, autoryzację, obsługę błędów walidacji i poprawność struktury odpowiedzi.
