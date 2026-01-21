# API Endpoint Implementation Plan: Create Exercise

## 1. Przegląd punktu końcowego

Endpoint `POST /exercises` umożliwia zalogowanemu trenerowi dodanie nowego, niestandardowego ćwiczenia do swojej biblioteki. Utworzone ćwiczenie będzie widoczne tylko dla tego trenera (oraz jego klientów w ramach planów treningowych). Ćwiczenie jest automatycznie oznaczane jako niesystemowe (`isSystem: false`).

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/exercises`
- **Nagłówki:**
    -   `Authorization`: Bearer <token_jwt>
- **Ciało żądania (JSON):**
    ```json
    {
      "name": "Moje własne ćwiczenie",
      "muscleGroup": "CHEST"
    }
    ```
    -   `name`: Wymagane, string, max 255 znaków.
    -   `muscleGroup`: Wymagane, Enum `MuscleGroupType`.

## 3. Wykorzystywane typy

### DTOs
-   **`CreateExerciseDto`** (Należy utworzyć):
    -   `name`: string (Wymagane, `@IsNotEmpty`, `@IsString`, `@MaxLength(255)`)
    -   `muscleGroup`: MuscleGroupType (Wymagane, `@IsEnum(MuscleGroupType)`)

-   **`ExerciseResponseDto`** (Istniejące):
    -   Do zwrócenia utworzonego zasobu.

### Enums
-   `MuscleGroupType` (Istniejące).

## 4. Szczegóły odpowiedzi

**Kod statusu:** `201 Created`

**Ciało odpowiedzi (JSON):** Obiekt `ExerciseResponseDto`.

```json
{
  "id": "uuid-gen-by-db",
  "name": "Moje własne ćwiczenie",
  "muscleGroup": "CHEST",
  "isSystem": false,
  "trainerId": "user-uuid",
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

## 5. Przepływ danych

1.  **Controller (`ExercisesController`)**:
    -   Metoda `create` przyjmuje `CreateExerciseDto` oraz `User` (z dekoratora `@GetUser`).
    -   Waliduje DTO (poprawność Enuma i nazwy).
    -   Wywołuje `exercisesService.create(user.id, createExerciseDto)`.

2.  **Service (`ExercisesService`)**:
    -   Tworzy nową instancję encji `Exercise`.
    -   Ustawia pola z DTO.
    -   Ustawia `trainerId` na ID zalogowanego użytkownika.
    -   Ustawia `isSystem` na `false`.
    -   Wywołuje `exercisesRepository.save()`.
    -   Mapuje zapisaną encję na `ExerciseResponseDto` używając `plainToInstance`.

3.  **Database (PostgreSQL)**:
    -   Insert rekordu do tabeli `exercises`.
    -   Generowanie UUID i timestampów.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie:** Endpoint chroniony `JwtAuthGuard`.
-   **Przypisanie własności:** Kluczowe jest przypisanie `trainerId` z tokenu JWT, a nie z danych przesłanych przez użytkownika (nawet jeśli DTO by to umożliwiało, kontroler musi nadpisać/ignorować to pole, choć w tym DTO pola `trainerId` nie ma).
-   **Walidacja:** Strict validation na `muscleGroup` (musi być jednym ze zdefiniowanych w Enumie) oraz długość nazwy.

## 7. Obsługa błędów

| Scenariusz | Kod HTTP | Opis |
| :--- | :--- | :--- |
| Pomyślne utworzenie | 201 | Zwraca utworzony obiekt. |
| Błąd walidacji (np. błędna grupa mięśniowa) | 400 | Zwracany przez `ValidationPipe`. |
| Brak tokenu | 401 | Zwracany przez `JwtAuthGuard`. |
| Błąd bazy danych (np. awaria połączenia) | 500 | Internal Server Error. |

## 8. Rozważania dotyczące wydajności

-   Operacja pojedynczego insertu jest lekka.
-   Indeksy nie są obciążone przy pojedynczym wstawianiu w stopniu wpływającym na wydajność.

## 9. Etapy wdrożenia

1.  **Utworzenie DTO**:
    -   Stworzyć plik `backend/src/exercises/dto/create-exercise.dto.ts`.
    -   Zaimplementować klasę z polami `name` i `muscleGroup` oraz dekoratorami walidacji.

2.  **Implementacja w Serwisie**:
    -   W `backend/src/exercises/exercises.service.ts` dodać metodę `create(userId: string, dto: CreateExerciseDto)`.
    -   Zaimplementować logikę tworzenia encji.

3.  **Implementacja w Kontrolerze**:
    -   W `backend/src/exercises/exercises.controller.ts` dodać metodę `@Post()`.
    -   Skonfigurować `@Body()` i `@GetUser()`.
    -   Dodać dokumentację Swagger (`@ApiOperation`, `@ApiResponse`).

4.  **Weryfikacja**:
    -   Wysłanie żądania POST z poprawnymi danymi (sprawdzenie czy `isSystem` = false i `trainerId` jest poprawne).
    -   Wysłanie żądania z błędnym `muscleGroup` (sprawdzenie walidacji 400).
