# API Endpoint Implementation Plan: POST /trainer-profiles

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia utworzenie nowego profilu trenera dla istniejącego użytkownika w systemie. Operacja jest ograniczona do administratorów w celu zapewnienia kontrolowanego procesu onboardingu trenerów. Endpoint wiąże profil z istniejącym kontem użytkownika i pozwala na dodanie podstawowych informacji, takich jak opis, miasto i specjalizacje.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/trainer-profiles`
- **Parametry**: Brak parametrów w URL.
- **Request Body**:
  ```json
  {
    "userId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "description": "Doświadczony trener personalny z 10-letnim stażem.",
    "city": "Warszawa",
    "specializationIds": ["s1a2b3c4-...", "s2a2b3c4-..."]
  }
  ```
  - **Wymagane**: `userId`
  - **Opcjonalne**: `description`, `city`, `specializationIds`

## 3. Wykorzystywane typy

- **DTO**: `CreateTrainerProfileDto`

  - Zgodnie z dokumentem `generated-types-summary.md`, ten DTO już istnieje. Należy zweryfikować jego zgodność ze specyfikacją i dostosować w razie potrzeby.

  ```typescript
  // backend/src/trainer-profiles/dto/create-trainer-profile.dto.ts
  import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray } from 'class-validator'

  export class CreateTrainerProfileDto {
    @IsUUID()
    @IsNotEmpty()
    readonly userId: string

    @IsString()
    @IsOptional()
    readonly description?: string

    @IsString()
    @IsOptional()
    readonly city?: string

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    readonly specializationIds?: string[]
  }
  ```

- **Encje**: `TrainerProfile`, `User`, `Specialization` (TypeORM)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**: Zwraca nowo utworzony obiekt profilu trenera.
  ```json
  {
    "id": "p1a2b3c4-...",
    "userId": "a1b2c3d4-...",
    "description": "Doświadczony trener personalny z 10-letnim stażem.",
    "city": "Warszawa",
    "profilePictureUrl": null,
    "createdAt": "2025-11-16T10:00:00.000Z",
    "updatedAt": "2025-11-16T10:00:00.000Z",
    "specializations": [{ "id": "s1a2b3c4-...", "name": "Trening siłowy" }]
  }
  ```
- **Odpowiedzi błędów**: Zgodnie z sekcją "Obsługa błędów".

## 5. Przepływ danych

1.  Żądanie `POST /trainer-profiles` trafia do `TrainerProfilesController`.
2.  Uwierzytelnianie jest weryfikowane przez `JwtAuthGuard`.
3.  Autoryzacja jest sprawdzana przez `RolesGuard` (wymagana rola: `ADMIN`).
4.  Ciało żądania jest walidowane przez `ValidationPipe` przy użyciu `CreateTrainerProfileDto`.
5.  Jeśli walidacja DTO przejdzie pomyślnie, kontroler wywołuje metodę `create()` w `TrainerProfilesService`, przekazując DTO.
6.  `TrainerProfilesService` wykonuje logikę biznesową:
    a. Wyszukuje użytkownika o podanym `userId` w tabeli `users`. Sprawdza, czy istnieje i czy jego rola to `TRAINER`.
    b. Sprawdza, czy w tabeli `trainer_profiles` nie istnieje już profil dla tego `userId`.
    c. Jeśli `specializationIds` zostały podane, wyszukuje odpowiednie encje w tabeli `specializations`.
    d. Tworzy nową instancję encji `TrainerProfile`, wypełniając ją danymi z DTO oraz powiązanymi specjalizacjami.
    e. Zapisuje nową encję w bazie danych za pomocą `TypeORM Repository`.
7.  Serwis zwraca nowo utworzoną encję do kontrolera.
8.  Kontroler zwraca odpowiedź `201 Created` z serializowanym obiektem profilu trenera.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization`.
- **Autoryzacja**: Należy zaimplementować `RolesGuard` i użyć dekoratora `@Roles(Role.ADMIN)` na metodzie kontrolera, aby ograniczyć dostęp tylko dla administratorów.
- **Walidacja danych wejściowych**: Globalny `ValidationPipe` z opcjami `whitelist: true` i `forbidNonWhitelisted: true` musi być włączony, aby chronić przed nieoczekiwanymi polami w ciele żądania. DTO `CreateTrainerProfileDto` z dekoratorami `class-validator` zapewni poprawność typów i formatów danych (np. UUID).
- **Ochrona przed atakami**: Użycie ORM (TypeORM) zapobiega atakom typu SQL Injection.

## 7. Obsługa błędów

| Kod statusu                 | Opis                                                                                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | - Błąd walidacji DTO (np. `userId` nie jest w formacie UUID).<br>- Użytkownik o podanym `userId` nie istnieje lub nie jest trenerem.<br>- Przynajmniej jeden z `specializationIds` jest nieprawidłowy lub nie istnieje. |
| `401 Unauthorized`          | Brak, nieprawidłowy lub wygasły token JWT.                                                                                                                                                                              |
| `403 Forbidden`             | Użytkownik próbujący wykonać operację nie ma roli `ADMIN`.                                                                                                                                                              |
| `409 Conflict`              | Profil dla podanego `userId` już istnieje w systemie.                                                                                                                                                                   |
| `500 Internal Server Error` | Wewnętrzny błąd serwera, np. problem z połączeniem z bazą danych.                                                                                                                                                       |

## 8. Rozważania dotyczące wydajności

- Operacje na bazie danych (sprawdzanie użytkownika, specjalizacji, zapis profilu) powinny być zoptymalizowane.
- Zapytania do bazy danych powinny być wykonywane w ramach jednej transakcji, aby zapewnić spójność danych w przypadku błędu.
- Należy zadbać o odpowiednie indeksy na kluczach obcych (`user_id` w `trainer_profiles`) i polach unikalnych, aby przyspieszyć wyszukiwanie. Tabela `db-plan.md` już to przewiduje.

## 9. Etapy wdrożenia

1.  **Aktualizacja DTO**: Zweryfikuj i ewentualnie zaktualizuj plik `backend/src/trainer-profiles/dto/create-trainer-profile.dto.ts`, aby był zgodny ze specyfikacją.
2.  **Implementacja `RolesGuard`**: Jeśli jeszcze nie istnieje, stwórz `RolesGuard` w `backend/src/common/guards/` oraz dekorator `@Roles` w `backend/src/common/decorators/`. Zdefiniuj enum `Role` (jeśli go brakuje).
3.  **Aktualizacja `TrainerProfilesController`**:
    - Dodaj nową metodę `create(@Body() createTrainerProfileDto: CreateTrainerProfileDto)`.
    - Zabezpiecz metodę za pomocą `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles(Role.ADMIN)`.
    - Użyj dekoratora `@Post()` i ustaw kod odpowiedzi na `@HttpCode(201)`.
    - Wstrzyknij i wywołaj `TrainerProfilesService`.
4.  **Implementacja logiki w `TrainerProfilesService`**:
    - Wstrzyknij repozytoria dla `TrainerProfile`, `User` i `Specialization`.
    - Zaimplementuj metodę `create()`, która zawiera całą logikę biznesową opisaną w sekcji "Przepływ danych".
    - Użyj `EntityManager` lub `QueryRunner` do opakowania operacji w transakcję.
    - Rzucaj odpowiednie wyjątki NestJS (`BadRequestException`, `NotFoundException`, `ConflictException`) w przypadku błędów walidacji biznesowej.
5.  **Testy jednostkowe**:
    - Napisz testy jednostkowe dla `TrainerProfilesService`, mockując repozytoria i sprawdzając wszystkie scenariusze (sukces, błędy, przypadki brzegowe).
6.  **Testy E2E**:
    - Napisz testy end-to-end dla endpointu `POST /trainer-profiles`, symulując żądania HTTP i weryfikując odpowiedzi oraz stan bazy danych dla różnych scenariuszy (autoryzacja, poprawne i niepoprawne dane).
7.  **Dokumentacja API**:
    - Dodaj adnotacje `@nestjs/swagger` (`@ApiOperation`, `@ApiResponse`, `@ApiBody`) do metody w kontrolerze, aby automatycznie wygenerować dokumentację OpenAPI.
