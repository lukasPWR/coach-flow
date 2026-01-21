# API Endpoint Implementation Plan: Get Exercises List

## 1. Przegląd punktu końcowego

Endpoint `GET /exercises` służy do pobierania listy ćwiczeń dostępnych dla zalogowanego użytkownika (trenera). Zwraca on sumę zbiorów:
1.  Ćwiczeń systemowych (dostępnych dla wszystkich).
2.  Ćwiczeń prywatnych stworzonych przez danego trenera.

Endpoint wspiera filtrowanie po nazwie oraz grupie mięśniowej.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/exercises`
- **Parametry zapytania (Query Params):**
    -   `search` (Opcjonalny): Ciąg znaków do wyszukiwania w nazwie ćwiczenia (partial match).
    -   `muscleGroup` (Opcjonalny): Wartość z enuma `MuscleGroupType` do filtrowania po partii mięśniowej.
- **Nagłówki:**
    -   `Authorization`: Bearer <token_jwt>

## 3. Wykorzystywane typy

### DTOs
-   `ExerciseQueryDto`:
    -   `search`: string (optional)
    -   `muscleGroup`: MuscleGroupType (optional)
-   `ExerciseResponseDto`:
    -   `id`: string (UUID)
    -   `name`: string
    -   `muscleGroup`: MuscleGroupType
    -   `isSystem`: boolean
    -   `trainerId`: string | null

### Enums
-   `MuscleGroupType` (zdefiniowany w `backend/src/exercises/enums/muscle-group-type.enum.ts`)

## 4. Szczegóły odpowiedzi

**Kod statusu:** `200 OK`

**Ciało odpowiedzi (JSON):** Tablica obiektów `ExerciseResponseDto`.

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Wyciskanie sztangi na ławce poziomej",
    "muscleGroup": "CHEST",
    "isSystem": true,
    "trainerId": null
  },
  {
    "id": "987fcdeb-51a2-43f1-a567-987654321000",
    "name": "Moje specyficzne ćwiczenie",
    "muscleGroup": "BACK",
    "isSystem": false,
    "trainerId": "user-uuid-here"
  }
]
```

## 5. Przepływ danych

1.  **Controller (`ExercisesController`)**:
    -   Odbiera żądanie `GET`.
    -   Wykorzystuje `ValidationPipe` do walidacji `ExerciseQueryDto`.
    -   Pobiera `userId` z obiektu `req.user` (wstrzykniętego przez `JwtAuthGuard`).
    -   Wywołuje metodę serwisu `findAll`.

2.  **Service (`ExercisesService`)**:
    -   Tworzy `QueryBuilder` dla encji `Exercise`.
    -   Buduje warunek `WHERE`: `(is_system = true OR trainer_id = :userId)`.
    -   Dokłada warunki dynamiczne jeśli parametry są obecne:
        -   Jeśli `search`: `AND name ILIKE :search` (z `%` na początku i końcu).
        -   Jeśli `muscleGroup`: `AND muscle_group = :muscleGroup`.
    -   Sortuje wyniki (np. po nazwie).
    -   Wykonuje zapytanie do bazy danych.

3.  **Database (PostgreSQL)**:
    -   Wykorzystuje indeksy `idx_exercises_name_trgm` (dla search) oraz standardowe indeksy dla `trainer_id`, `is_system` i `muscle_group`.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Wymagany poprawny token JWT (Guard `JwtAuthGuard`).
-   **Autoryzacja danych**: Użytkownik widzi tylko ćwiczenia systemowe oraz TE, których jest właścicielem (`trainer_id`). Nie ma dostępu do prywatnych ćwiczeń innych trenerów.
-   **Sanityzacja**: `class-validator` i `class-transformer` czyszczą dane wejściowe. Parametryzowane zapytania TypeORM chronią przed SQL Injection.

## 7. Obsługa błędów

| Scenariusz | Kod HTTP | Opis |
| :--- | :--- | :--- |
| Poprawne pobranie danych | 200 | Zwraca listę (może być pusta). |
| Błąd walidacji (np. błędna grupa mięśniowa) | 400 | Zwracany automatycznie przez `ValidationPipe`. |
| Brak tokenu / Nieprawidłowy token | 401 | Zwracany przez `JwtAuthGuard`. |
| Błąd połączenia z bazą danych | 500 | Logowany po stronie serwera, klient otrzymuje ogólny komunikat błędu. |

## 8. Rozważania dotyczące wydajności

-   **Indeksy**: Baza danych posiada dedykowane indeksy wspierające to zapytanie (zweryfikowano w migracji `1737158400000`).
-   **Paginacja**: W obecnej specyfikacji API nie ma wymogu paginacji, ale `QueryBuilder` w serwisie powinien być napisany w sposób umożliwiający łatwe dodanie `.take()` i `.skip()` w przyszłości, jeśli lista ćwiczeń urośnie znacząco.
-   **Selekcja pól**: Należy pobierać tylko wymagane kolumny, jeśli encja `Exercise` zawierałaby ciężkie pola (np. treści binarne), choć w obecnym schemacie (tekstowe opisy) nie jest to krytyczne.

## 9. Etapy wdrożenia

1.  **Weryfikacja/Utworzenie DTO**:
    -   Upewnij się, że plik `backend/src/exercises/dto/exercise-query.dto.ts` istnieje i zawiera poprawne dekoratory walidacji (`IsOptional`, `IsString`, `IsEnum`).
    -   Upewnij się, że plik `backend/src/exercises/dto/exercise-response.dto.ts` istnieje.

2.  **Implementacja w Serwisie**:
    -   W `backend/src/exercises/exercises.service.ts` dodaj metodę `findAll(userId: string, query: ExerciseQueryDto): Promise<ExerciseResponseDto[]>`.
    -   Zaimplementuj logikę `QueryBuilder` uwzględniającą warunki `OR` dla własności oraz `AND` dla filtrów.

3.  **Implementacja w Kontrolerze**:
    -   W `backend/src/exercises/exercises.controller.ts` dodaj metodę obsługującą `GET /`.
    -   Dodaj dekoratory `@Get()`, `@UseGuards(JwtAuthGuard)`.
    -   Skonfiguruj parametry: `@Query() query: ExerciseQueryDto` oraz `@User() user`.

4.  **Testy Manualne**:
    -   Wywołanie endpointu jako zalogowany użytkownik bez parametrów (oczekiwane: systemowe + własne).
    -   Wywołanie z filtrem `search` (oczekiwane: filtrowanie po nazwie).
    -   Wywołanie z filtrem `muscleGroup` (oczekiwane: filtrowanie po kategorii).
    -   Weryfikacja, że nie widać ćwiczeń innego trenera.
