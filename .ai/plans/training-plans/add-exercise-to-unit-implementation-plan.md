# API Endpoint Implementation Plan: Add Exercise to Unit

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /training-units/:unitId/exercises` umożliwia trenerowi dodanie konkretnego ćwiczenia (z biblioteki ćwiczeń) do wybranej jednostki treningowej (np. "Dzień A"). W trakcie dodawania definiowane są parametry treningowe takie jak serie, powtórzenia, ciężar, tempo, przerwy oraz uwagi.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/training-units/:unitId/exercises`
- **Parametry URL:**
  - `unitId` (UUID): Identyfikator jednostki treningowej, do której dodajemy ćwiczenie.
- **Request Body (JSON):**
  - Obiekt zgodny z `CreatePlanExerciseDto`.
  - Pola:
    - `exerciseId` (UUID, Wymagane): ID ćwiczenia z bazy `exercises`.
    - `sets` (string, Opcjonalne): np. "3" lub "3-4".
    - `reps` (string, Opcjonalne): np. "10" lub "8-12".
    - `weight` (string, Opcjonalne): np. "20kg" lub "RPE 8".
    - `tempo` (string, Opcjonalne): np. "2010".
    - `rest` (string, Opcjonalne): np. "60s".
    - `notes` (string, Opcjonalne): Uwagi dla klienta.
    - `sortOrder` (number, Opcjonalne): Kolejność w jednostce (jeśli nie podana, system powinien dodać na koniec).

## 3. Wykorzystywane typy

### DTOs

- `CreatePlanExerciseDto` (`backend/src/plan-exercises/dto/create-plan-exercise.dto.ts`)
  - **Uwaga:** Należy upewnić się, że to DTO **nie** zawiera pola `trainingUnitId` (jest ono w URL) lub jest ono ignorowane/nadpisywane w kontrolerze. Zgodnie z `training-plans-types.md`, DTO nie zawiera `trainingUnitId`.
- `PlanExerciseResponseDto` (`backend/src/plan-exercises/dto/plan-exercise-response.dto.ts`) - Struktura zwracana.

### Encje

- `TrainingUnit` (`backend/src/training-units/entities/training-unit.entity.ts`) - Do weryfikacji rodzica.
- `Exercise` (`backend/src/exercises/entities/exercise.entity.ts`) - Do weryfikacji istnienia ćwiczenia.
- `PlanExercise` (`backend/src/plan-exercises/entities/plan-exercise.entity.ts`) - Tworzona encja.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `201 Created`
- **Ciało odpowiedzi:** Utworzony obiekt `PlanExerciseResponseDto`.

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `POST` z `unitId` i parametrami ćwiczenia.
2.  **Kontroler (`TrainingUnitsController` lub `PlanExercisesController` z odpowiednią ścieżką)** odbiera żądanie. Z uwagi na strukturę URL `/training-units/...`, naturalnym miejscem jest `TrainingUnitsController` (endpoint `@Post(':unitId/exercises')`), który deleguje logikę do serwisu.
3.  **TrainingUnitsController** przekazuje dane do `PlanExercisesService` (metoda np. `create(unitId: string, dto: CreatePlanExerciseDto, userId: string)`).
4.  **PlanExercisesService**:
    a. Weryfikuje istnienie `TrainingUnit` o podanym ID.
    b. **Autoryzacja (Ownership):** Sprawdza, czy jednostka należy do planu, który należy do aktualnego trenera (`unit.trainingPlan.trainerId === user.id`).
    c. Weryfikuje istnienie `Exercise` o podanym `exerciseId` (oraz czy trener ma do niego dostęp - systemowe lub własne).
    d. Oblicza `sortOrder`. Jeśli nie podano w DTO, pobiera `MAX(sortOrder)` dla danej jednostki i dodaje 1.
    e. Tworzy nową encję `PlanExercise`, wiążąc ją z `TrainingUnit` i `Exercise`.
    f. Zapisuje encję w bazie danych.
5.  Zwraca zmapowane DTO.

## 6. Względy bezpieczeństwa

- **JWT Auth & Role:** Tylko zalogowani użytkownicy z rolą `TRAINER`.
- **Resource Ownership:**
  - Czy trener jest właścicielem jednostki (poprzez plan)?
  - Czy trener ma prawo użyć danego `exerciseId` (ćwiczenie publiczne lub własne trenera)?
- **Validation:** Walidacja parametrów wejściowych (UUID, długość stringów) przez `ValidationPipe`.

## 7. Obsługa błędów

| Scenariusz                      | Kod HTTP         | Komunikat błędu                      |
| :------------------------------ | :--------------- | :----------------------------------- | ---------------------------- |
| Błędy walidacji DTO             | 400 Bad Request  | Validation failed...                 |
| Brak tokenu                     | 401 Unauthorized | Unauthorized                         |
| Brak uprawnień (Klient)         | 403 Forbidden    | Forbidden resource                   |
| Próba modyfikacji cudzego planu | 403 Forbidden    | You cannot modify this training unit |
| Próba użycia cudzego ćwiczenia  | 403 Forbidden    | / 404 Not Found                      | You cannot use this exercise |
| Jednostka nie znaleziona        | 404 Not Found    | Training unit not found              |
| Ćwiczenie nie znalezione        | 404 Not Found    | Exercise not found                   |

## 8. Rozważania dotyczące wydajności

- Należy unikać problemu N+1 przy sprawdzaniu uprawnień (fetchuj `TrainingUnit` z `TrainingPlan` w jednym zapytaniu).
- Sprawdzenie `Exercise` to proste zapytanie po ID (z indeksem).
- Obliczanie `sortOrder` może wymagać agregacji (`MAX`), ale w skali jednej jednostki (maks kilkanaście ćwiczeń) jest to pomijalne.

## 9. Etapy wdrożenia

1.  **Zależności Modułów:** Upewnij się, że `TrainingUnitsModule` importuje `PlanExercisesModule` (lub odwrotnie, w zależności od tego, gdzie umieścimy kontroler).
    - _Rekomendacja:_ Ponieważ URL zaczyna się od `/training-units`, endpoint powinien być w `TrainingUnitsController`. Wymaga to wstrzyknięcia `PlanExercisesService` do `TrainingUnitsController`. Zatem `TrainingUnitsModule` musi importować `PlanExercisesModule` (i `PlanExercisesService` musi być wyeksportowany).
2.  **Metoda Serwisu (`PlanExercisesService`):**
    - Dodaj metodę `create(unitId: string, createDto: CreatePlanExerciseDto, userId: string): Promise<PlanExerciseResponseDto>`.
    - Zaimplementuj logikę pobierania `TrainingUnit` (z `relations: ['trainingPlan']`) i walidację `trainerId`.
    - Zaimplementuj walidację `Exercise`.
    - Zaimplementuj logikę `sortOrder` (jeśli brak w DTO).
    - Zapisz.
3.  **Endpoint Kontrolera (`TrainingUnitsController`):**
    - Dodaj `@Post(':unitId/exercises')`.
    - Pobierz `unitId` z `@Param()`.
    - Pobierz `dto` z `@Body()`.
    - Wywołaj serwis.
4.  **Testy:**
    - Unit testy dla serwisu (happy path, unit ownership check, exercise check).
    - E2E test dla endpointu.
