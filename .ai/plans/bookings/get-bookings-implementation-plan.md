# API Endpoint Implementation Plan: GET /bookings

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom (zarówno klientom, jak i trenerom) pobieranie listy swoich rezerwacji. Zapewnia funkcje filtrowania i paginacji w celu ułatwienia nawigacji po danych.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/bookings`
-   **Parametry (Query)**:
    -   **Opcjonalne**:
        -   `status: string` - Filtruje rezerwacje według statusu. Dopuszczalne wartości: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`.
        -   `role: string` - Określa perspektywę dla użytkowników będących jednocześnie klientem i trenerem. Dopuszczalne wartości: `client`, `trainer`.
        -   `page: number` - Numer strony dla paginacji (domyślnie 1).
        -   `limit: number` - Liczba wyników na stronę (domyślnie 10).
-   **Request Body**: Brak.

## 3. Wykorzystywane typy

### Enums

**`BookingStatus` (interfaces/booking-status.enum.ts)** - Istniejący enum.

```typescript
export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
```

**`UserBookingRole` (dto/get-bookings-query.dto.ts)** - Nowy enum dla parametru `role`.

```typescript
export enum UserBookingRole {
  CLIENT = 'client',
  TRAINER = 'trainer',
}
```

### DTOs

**`GetBookingsQueryDto` (dto/get-bookings-query.dto.ts)** - Nowy DTO do walidacji parametrów zapytania.

```typescript
import { IsEnum, IsInt, IsOptional, Min, Type } from 'class-validator';
import { BookingStatus } from '../interfaces/booking-status.enum';
import { UserBookingRole } from './get-bookings-query.dto';

export class GetBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  readonly status?: BookingStatus;

  @IsOptional()
  @IsEnum(UserBookingRole)
  readonly role?: UserBookingRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number = 10;
}
```

**`PaginatedBookingsResponseDto` (dto/paginated-bookings-response.dto.ts)** - Nowy DTO do strukturyzacji odpowiedzi.

```typescript
import { Booking } from '../entities/booking.entity'; // Założenie istnienia encji

class PaginationMeta {
  readonly totalItems: number;
  readonly itemCount: number;
  readonly itemsPerPage: number;
  readonly totalPages: number;
  readonly currentPage: number;
}

export class PaginatedBookingsResponseDto {
  readonly data: Booking[]; // lub BookingResponseDto[]
  readonly meta: PaginationMeta;
}
```

## 4. Szczegóły odpowiedzi

-   **Sukces (`200 OK`)**: Odpowiedź zawiera obiekt z dwoma polami: `data` (tablica obiektów rezerwacji) i `meta` (obiekt z informacjami o paginacji).

    ```json
    {
      "data": [
        {
          "id": "uuid-goes-here",
          "startTime": "2025-11-26T10:00:00.000Z",
          "endTime": "2025-11-26T11:00:00.000Z",
          "status": "ACCEPTED",
          "client": { "id": "client-uuid", "name": "Jan Kowalski" },
          "trainer": { "id": "trainer-uuid", "name": "Anna Nowak" },
          "service": { "id": "service-uuid", "name": "Trening personalny" }
        }
      ],
      "meta": {
        "totalItems": 1,
        "itemCount": 1,
        "itemsPerPage": 10,
        "totalPages": 1,
        "currentPage": 1
      }
    }
    ```

-   **Błąd (`4xx/5xx`)**: Standardowa odpowiedź błędu NestJS.
    ```json
    {
      "statusCode": 400,
      "message": ["status must be one of the following values: PENDING, ACCEPTED, REJECTED, CANCELLED"],
      "error": "Bad Request"
    }
    ```

## 5. Przepływ danych

1.  Żądanie `GET /bookings` trafia do `BookingsController`.
2.  `JwtAuthGuard` weryfikuje token JWT i dołącza obiekt `user` (zawierający `id` i `role`) do obiektu żądania.
3.  `ValidationPipe` waliduje parametry zapytania przy użyciu `GetBookingsQueryDto`.
4.  Metoda kontrolera wywołuje `bookingsService.findUserBookings()`, przekazując `userId` z tokena oraz zwalidowane parametry zapytania.
5.  `BookingsService` konstruuje zapytanie do bazy danych (poprzez `BookingRepository`):
    -   Oblicza offset (`skip`) i limit (`take`) dla paginacji.
    -   Buduje warunek `WHERE` w oparciu o `userId`. Domyślnie `(client_id = :userId OR trainer_id = :userId)`.
    -   Jeśli parametr `role` jest zdefiniowany, warunek jest zawężany do `client_id = :userId` lub `trainer_id = :userId`.
    -   Jeśli parametr `status` jest zdefiniowany, dodawany jest warunek `AND status = :status`.
    -   Wykonuje dwa zapytania: jedno `findAndCount` (lub `find` + `count`) do pobrania danych i całkowitej liczby pasujących rekordów.
6.  Serwis mapuje wyniki z bazy danych na `PaginatedBookingsResponseDto`, dołączając dane o paginacji.
7.  Kontroler zwraca zmapowany obiekt DTO jako odpowiedź.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Dostęp jest możliwy tylko dla zalogowanych użytkowników.
-   **Autoryzacja**: Logika w `BookingsService` musi rygorystycznie filtrować rezerwacje na podstawie `userId` pobranego z zaufanego źródła (token JWT). Zapobiega to możliwości dostępu do rezerwacji innych użytkowników (IDOR).
-   **Walidacja danych wejściowych**: Wszystkie parametry zapytania muszą być walidowane za pomocą `GetBookingsQueryDto`, aby zapobiec błędom i potencjalnym atakom (np. SQL Injection, chociaż ORM w dużej mierze przed tym chroni).

## 7. Obsługa błędów

-   **`400 Bad Request`**: Zwracany, gdy walidacja parametrów zapytania w `GetBookingsQueryDto` nie powiodła się. Obsługiwany automatycznie przez `ValidationPipe`.
-   **`401 Unauthorized`**: Zwracany, gdy użytkownik nie jest zalogowany. Obsługiwany automatycznie przez `JwtAuthGuard`.
-   **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu po stronie serwera, np. problemu z połączeniem z bazą danych. Zalecane jest opakowanie logiki serwisu w blok `try-catch` i logowanie szczegółów błędu za pomocą `Logger`.

## 8. Rozważania dotyczące wydajności

-   **Indeksy bazodanowe**: Należy upewnić się, że istnieją indeksy na kolumnach `client_id`, `trainer_id` i `status` w tabeli `bookings`, aby przyspieszyć operacje filtrowania.
-   **Paginacja**: Paginacja jest kluczowa, aby unikać pobierania dużych zbiorów danych w jednym żądaniu.
-   **JOINs**: Zapytanie powinno zoptymalizować dołączanie (`JOIN`) danych z tabel `users` i `services`, wybierając tylko niezbędne pola, aby zmniejszyć narzut.

## 9. Etapy wdrożenia

1.  **Utworzenie DTO i Enum**:
    -   W `backend/src/bookings/dto/` utwórz plik `get-bookings-query.dto.ts`.
    -   Zdefiniuj w nim enum `UserBookingRole` oraz klasę `GetBookingsQueryDto` z odpowiednimi dekoratorami `class-validator`.
    -   W `backend/src/bookings/dto/` utwórz plik `paginated-bookings-response.dto.ts` z definicją DTO odpowiedzi.

2.  **Aktualizacja `BookingsController`**:
    -   Dodaj nową metodę `findAll(@Req() req, @Query() query: GetBookingsQueryDto)`.
    -   Zabezpiecz metodę za pomocą `@UseGuards(JwtAuthGuard)`.
    -   Dodaj dekoratory `@ApiOkResponse`, `@ApiUnauthorizedResponse`, `@ApiBadRequestResponse` dla dokumentacji Swagger.
    -   W ciele metody wywołaj serwis `bookingsService.findUserBookings(req.user.id, query)`.

3.  **Implementacja logiki w `BookingsService`**:
    -   Dodaj nową metodę `async findUserBookings(userId: string, queryDto: GetBookingsQueryDto): Promise<PaginatedBookingsResponseDto>`.
    -   Wstrzyknij repozytorium `BookingRepository` (`@InjectRepository(Booking)`).
    -   Zaimplementuj logikę budowania zapytania (najlepiej używając `QueryBuilder` z TypeORM, aby dynamicznie dodawać warunki).
    -   Obsłuż paginację, pobierając `page` i `limit` z `queryDto`.
    -   Wykonaj zapytanie, pobierając zarówno dane, jak i całkowitą liczbę pasujących rekordów.
    -   Zmapuj wyniki na obiekt `PaginatedBookingsResponseDto` i zwróć go.

4.  **Dodanie testów**:
    -   Napisz testy jednostkowe dla `BookingsService`, sprawdzając, czy zapytania są poprawnie budowane dla różnych kombinacji parametrów (`status`, `role`).
    -   Napisz testy e2e dla `GET /bookings`, które zweryfikują:
        -   Poprawną odpowiedź dla uwierzytelnionego użytkownika.
        -   Status `401` dla nieuwierzytelnionego żądania.
        -   Status `400` dla nieprawidłowych parametrów zapytania.
        -   Poprawne działanie filtrowania i paginacji.
