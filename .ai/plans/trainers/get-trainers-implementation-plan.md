# API Endpoint Implementation Plan: GET /trainers

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest udostępnienie publicznego, paginowanego i filtrowalnego widoku profili trenerów. Umożliwi to użytkownikom (zarówno gościom, jak i zalogowanym) przeglądanie dostępnych trenerów na podstawie kryteriów takich jak miasto czy specjalizacja.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/trainers`
- **Parametry (Query Params)**:
  - **Opcjonalne**:
    - `page` (number): Numer strony do pobrania. Domyślnie: `1`.
    - `limit` (number): Liczba wyników na stronie. Domyślnie: `10`.
    - `city` (string): Filtruje trenerów po podanym mieście (case-insensitive).
    - `specializationId` (UUID): Filtruje trenerów, którzy posiadają daną specjalizację.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

1.  **`find-trainers-query.dto.ts`** (dla walidacji Query Params)

    ```typescript
    import { Type } from 'class-transformer'
    import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

    export class FindTrainersQueryDto {
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      page: number = 1

      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(100)
      limit: number = 10

      @IsOptional()
      @IsString()
      city?: string

      @IsOptional()
      @IsUUID()
      specializationId?: string
    }
    ```

2.  **`trainer-public-profile.response.dto.ts`** (dla pojedynczego trenera w liście)

    ```typescript
    class SpecializationDto {
      id: string
      name: string
    }

    export class TrainerPublicProfileResponseDto {
      id: string // User ID
      name: string
      city?: string
      description?: string
      profilePictureUrl?: string
      specializations: SpecializationDto[]
    }
    ```

3.  **`paginated-trainers.response.dto.ts`** (główny obiekt odpowiedzi)

    ```typescript
    import { TrainerPublicProfileResponseDto } from './trainer-public-profile.response.dto'

    class PaginationMetaDto {
      total: number
      page: number
      limit: number
    }

    export class PaginatedTrainersResponseDto {
      data: TrainerPublicProfileResponseDto[]
      meta: PaginationMetaDto
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**: Zwraca obiekt zawierający paginowaną listę profili trenerów oraz metadane.
  ```json
  {
    "data": [
      {
        "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
        "name": "Anna Nowak",
        "city": "Warszawa",
        "description": "Certyfikowany trener personalny z 10-letnim doświadczeniem.",
        "profilePictureUrl": "https://example.com/profile.jpg",
        "specializations": [
          { "id": "s1c2d3e4-...", "name": "Trening siłowy" },
          { "id": "s5a6b7c8-...", "name": "Utrata wagi" }
        ]
      }
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 10
    }
  }
  ```

## 5. Przepływ danych

1.  Żądanie `GET /trainers` trafia do metody `findAll` w `TrainerProfilesController`.
2.  `ValidationPipe` w NestJS automatycznie waliduje i transformuje parametry zapytania przy użyciu `FindTrainersQueryDto`.
3.  Kontroler wywołuje metodę `findAllPublic(query: FindTrainersQueryDto)` w `TrainerProfilesService`.
4.  Serwis konstruuje zapytanie za pomocą `QueryBuilder` z TypeORM:
    - Rozpoczyna od `trainer_profiles` (alias `profile`).
    - `INNER JOIN` z `users` (alias `user`) na `profile.userId = user.id` w celu pobrania `name`.
    - `LEFT JOIN` z `profile.specializations` (alias `specialization`) w celu dołączenia specjalizacji.
    - Wybiera tylko wymagane, publiczne pola (`profile.id`, `user.name`, `profile.city`, etc.), aby uniknąć ujawnienia wrażliwych danych.
    - Warunkowo dodaje klauzulę `WHERE` dla `city` (używając `ILIKE` dla case-insensitivity) i `specializationId`, jeśli są one dostarczone w `query`.
    - Ustawia paginację za pomocą `skip()` i `take()` na podstawie `page` i `limit`.
5.  Serwis wykonuje dwa zapytania:
    - `getMany()` do pobrania paginowanej listy profili.
    - `getCount()` do uzyskania całkowitej liczby profili pasujących do filtrów (dla metadanych).
6.  Wyniki są mapowane na `PaginatedTrainersResponseDto`.
7.  Kontroler zwraca zmapowany obiekt DTO z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Walidacja wejścia**: Wszystkie parametry zapytania są ściśle walidowane przez `FindTrainersQueryDto`, co zapobiega nieoczekiwanym typom danych i wartościom (np. `limit` jest ograniczony do `100`).
- **Ochrona przed SQL Injection**: Użycie `QueryBuilder` z TypeORM zapewnia parametryzację zapytań, co jest standardową ochroną przed atakami SQL Injection.
- **Ekspozycja danych**: Zapytanie do bazy danych musi jawnie wybierać tylko publiczne pola. Należy upewnić się, że pola takie jak `password_hash` z tabeli `users` nie są włączane do wyniku.
- **Brak uwierzytelniania**: Endpoint jest publiczny, więc nie wymaga tokena JWT.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany automatycznie przez `ValidationPipe`, jeśli parametry zapytania nie przejdą walidacji (np. `page` jest stringiem, `specializationId` nie jest UUID). Odpowiedź będzie zawierać szczegóły błędu walidacji.
- **`500 Internal Server Error`**: Zwracany przez globalny `HttpExceptionFilter` w przypadku niepowodzenia zapytania do bazy danych lub innego nieoczekiwanego błędu serwera. Błąd zostanie zarejestrowany za pomocą `Logger` NestJS.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych**: Należy upewnić się, że kolumny używane do filtrowania (`city` w `trainer_profiles` i `specialization_id` w tabeli łączącej `trainer_specializations`) są odpowiednio zindeksowane w bazie danych PostgreSQL.
- **Paginacja**: Obowiązkowa paginacja zapobiega pobieraniu dużych ilości danych w jednym żądaniu, co chroni serwer i bazę danych przed przeciążeniem.
- **Optymalizacja zapytań**: `LEFT JOIN` jest używany do specjalizacji, aby zapewnić, że trenerzy bez specjalizacji również pojawią się w wynikach (jeśli nie filtrujemy po specjalizacji). Należy monitorować wydajność tego zapytania.

## 9. Etapy wdrożenia

1.  **Utworzenie DTOs**:

    - Stworzyć plik `backend/src/trainer-profiles/dto/find-trainers-query.dto.ts` i zaimplementować w nim klasę `FindTrainersQueryDto`.
    - Stworzyć plik `backend/src/trainer-profiles/dto/trainer-public-profile.response.dto.ts` i zaimplementować w nim klasy `SpecializationDto` i `TrainerPublicProfileResponseDto`.
    - Stworzyć plik `backend/src/trainer-profiles/dto/paginated-trainers.response.dto.ts` i zaimplementować w nim klasy `PaginationMetaDto` i `PaginatedTrainersResponseDto`.

2.  **Aktualizacja `TrainerProfilesController`**:

    - Dodać nową metodę `findAll(@Query() query: FindTrainersQueryDto)`.
    - Udekorować ją `@Get()`, `@HttpCode(200)` i `@ApiResponse(...)` z `@nestjs/swagger`.
    - W ciele metody wywołać `this.trainerProfilesService.findAllPublic(query)`.

3.  **Aktualizacja `TrainerProfilesService`**:

    - Dodać nową metodę `async findAllPublic(query: FindTrainersQueryDto): Promise<PaginatedTrainersResponseDto>`.
    - Wstrzyknąć repozytorium `TrainerProfile` (`@InjectRepository(TrainerProfile)`).
    - Zaimplementować logikę budowania zapytania za pomocą `QueryBuilder` zgodnie z opisem w sekcji "Przepływ danych".
    - Zmapować wyniki na `PaginatedTrainersResponseDto` i zwrócić je.

4.  **Testy**:
    - **Testy jednostkowe (Unit Tests)**: Dodać testy dla `TrainerProfilesService`, mockując repozytorium i sprawdzając, czy `QueryBuilder` jest wywoływany z poprawnymi parametrami dla różnych kombinacji filtrów.
    - **Testy E2E (End-to-End)**: Dodać testy dla `GET /trainers`, które sprawdzają:
      - Poprawność odpowiedzi `200 OK` z domyślnymi parametrami.
      - Działanie paginacji (`page`, `limit`).
      - Działanie filtrowania po `city` i `specializationId`.
      - Poprawność odpowiedzi `400 Bad Request` dla nieprawidłowych parametrów.
      - Strukturę odpowiedzi.
