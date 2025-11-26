# API Endpoint Implementation Plan: PATCH /specializations/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia administratorom aktualizację nazwy istniejącej specjalizacji. Dostęp jest ograniczony i wymaga odpowiednich uprawnień. Operacja polega na zidentyfikowaniu specjalizacji za pomocą jej unikalnego identyfikatora (`id`) i zmianie jej nazwy.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/specializations/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator (UUID) specjalizacji do zaktualizowania.
- **Ciało Żądania**:
  - **Content-Type**: `application/json`
  - **Struktura**:
    ```json
    {
      "name": "Nowa nazwa specjalizacji"
    }
    ```
    - `name` (string): Nowa, unikalna nazwa specjalizacji. Musi być niepustym ciągiem znaków.

## 3. Wykorzystywane typy

- **DTO Żądania**: `UpdateSpecializationDto`

  - Lokalizacja: `backend/src/specializations/dto/update-specialization.dto.ts`
  - Definicja:

    ```typescript
    import { IsString, IsNotEmpty } from 'class-validator'
    import { ApiProperty } from '@nestjs/swagger'

    export class UpdateSpecializationDto {
      @ApiProperty({
        example: 'Trening siłowy',
        description: 'Nowa nazwa specjalizacji',
      })
      @IsString()
      @IsNotEmpty()
      readonly name: string
    }
    ```

    _Uwaga: istniejący DTO może wymagać modyfikacji, aby pole `name` było wymagane._

- **DTO Odpowiedzi**: `SpecializationDto`

  - Lokalizacja: `backend/src/specializations/dto/specialization.dto.ts` (jeśli istnieje) lub bezpośrednio encja.
  - Definicja:

    ```typescript
    import { ApiProperty } from '@nestjs/swagger'

    export class SpecializationDto {
      @ApiProperty({
        description: 'Unikalny identyfikator specjalizacji',
        example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
      })
      id: string

      @ApiProperty({ description: 'Nazwa specjalizacji', example: 'Trening siłowy' })
      name: string
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**: Zwraca pełny, zaktualizowany obiekt specjalizacji.
  ```json
  {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "name": "Nowa nazwa specjalizacji"
  }
  ```
- **Błąd**: Zwraca standardowy obiekt błędu NestJS.
  ```json
  {
    "statusCode": 404,
    "message": "Specialization with id d290f1ee-6c54-4b01-90e6-d701748f0851 not found",
    "error": "Not Found"
  }
  ```

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do `SpecializationsController` na endpoint `/specializations/:id`.
2.  Uruchamiane są `Guards` (`JwtAuthGuard`, `RolesGuard`) w celu weryfikacji uwierzytelnienia i autoryzacji (`ADMIN`).
3.  `ParseUUIDPipe` waliduje format `:id`.
4.  Globalny `ValidationPipe` waliduje ciało żądania względem `UpdateSpecializationDto`.
5.  Kontroler wywołuje metodę `update(id, updateSpecializationDto)` w `SpecializationsService`.
6.  Serwis używa `PrismaClient` do:
    a. Sprawdzenia, czy specjalizacja o podanym `id` istnieje. Jeśli nie, rzuca `NotFoundException`.
    b. Sprawdzenia, czy nowa nazwa nie jest już zajęta przez inną specjalizację. Jeśli tak, rzuca `ConflictException`.
    c. Zaktualizowania rekordu w tabeli `specializations`.
7.  Serwis zwraca zaktualizowany obiekt do kontrolera.
8.  Kontroler serializuje obiekt (jeśli jest to skonfigurowane) i wysyła odpowiedź `200 OK` do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Żądania bez ważnego tokenu JWT w nagłówku `Authorization` zostaną odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Dostęp musi być ograniczony wyłącznie dla użytkowników z rolą `ADMIN`. Należy użyć `RolesGuard` w połączeniu z dekoratorem `@Roles(Role.ADMIN)`.
- **Walidacja danych wejściowych**:
  - Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych.
  - Ciało żądania musi być walidowane przez `ValidationPipe` z opcjami `whitelist: true` i `forbidNonWhitelisted: true`, aby odrzucać nieoczekiwane pola.

## 7. Obsługa błędów

| Kod statusu        | Warunek                                                                                | Komunikat błędu (przykład)                                          |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `400 Bad Request`  | `id` nie jest w formacie UUID lub `name` w ciele jest niepoprawne (puste, nie-string). | `Validation failed (uuid is expected)` / `name should not be empty` |
| `401 Unauthorized` | Brak lub nieprawidłowy token JWT.                                                      | `Unauthorized`                                                      |
| `403 Forbidden`    | Użytkownik nie posiada roli `ADMIN`.                                                   | `Forbidden resource`                                                |
| `404 Not Found`    | Nie znaleziono specjalizacji o podanym `id`.                                           | `Specialization with id ... not found`                              |
| `409 Conflict`     | Podana nazwa specjalizacji (`name`) jest już zajęta przez inny rekord.                 | `Specialization with name '...' already exists`                     |
| `500 Server Error` | Błąd połączenia z bazą danych lub inny nieoczekiwany błąd serwera.                     | `Internal server error`                                             |

## 8. Rozważania dotyczące wydajności

- Operacja jest prosta i obejmuje dwa zapytania do bazy danych (SELECT w celu walidacji, UPDATE w celu aktualizacji).
- Należy upewnić się, że kolumny `id` (klucz główny) i `name` (ograniczenie `UNIQUE`) w tabeli `specializations` są poprawnie zindeksowane, co jest standardem.
- Przy normalnym obciążeniu nie przewiduje się problemów z wydajnością.

## 9. Kroki implementacji

1.  **Aktualizacja DTO**: Upewnij się, że `UpdateSpecializationDto` w `backend/src/specializations/dto/update-specialization.dto.ts` ma pole `name` z walidatorami `@IsString()` i `@IsNotEmpty()`.
2.  **Implementacja metody w serwisie**: W `backend/src/specializations/specializations.service.ts` zaimplementuj metodę `update(id: string, dto: UpdateSpecializationDto)`.
    - Dodaj logikę sprawdzającą istnienie specjalizacji (`findUnique`).
    - Dodaj logikę sprawdzającą unikalność nowej nazwy.
    - Zaimplementuj aktualizację rekordu za pomocą `prisma.specialization.update`.
    - Rzucaj odpowiednie wyjątki (`NotFoundException`, `ConflictException`).
3.  **Implementacja metody w kontrolerze**: W `backend/src/specializations/specializations.controller.ts` dodaj metodę dla endpointu `PATCH /:id`.
    - Użyj dekoratorów `@Patch(':id')`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(Role.ADMIN)`.
    - Dodaj dekoratory `@ApiOkResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse` etc. dla dokumentacji Swagger.
    - Wstrzyknij parametr `:id` za pomocą `@Param('id', ParseUUIDPipe)`.
    - Wstrzyknij ciało żądania za pomocą `@Body()`.
    - Wywołaj metodę `specializationsService.update(...)`.
4.  **Testy E2E**: Utwórz nowy plik testowy lub zaktualizuj istniejący w `test/e2e/` w celu przetestowania:
    - Pomyślnej aktualizacji przez administratora (`200 OK`).
    - Próby aktualizacji przez użytkownika bez roli `ADMIN` (`403 Forbidden`).
    - Próby aktualizacji bez uwierzytelnienia (`401 Unauthorized`).
    - Próby aktualizacji nieistniejącej specjalizacji (`404 Not Found`).
    - Próby aktualizacji z nieprawidłowymi danymi (`400 Bad Request`).
    - Próby ustawienia nazwy, która już istnieje (`409 Conflict`).
