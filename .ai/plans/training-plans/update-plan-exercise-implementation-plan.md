# API Endpoint Implementation Plan: Update Plan Exercise

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /plan-exercises/:id` służy do aktualizacji parametrów treningowych (np. serii, powtórzeń, ciężaru, notatek) dla konkretnego ćwiczenia w ramach planu. Operacja ta jest dostępna wyłącznie dla trenerów, co pozwala im modyfikować wytyczne dla podopiecznych.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/plan-exercises/:id`
- **Parametry URL:**
  - `id` (UUID): Unikalny identyfikator wpisu w tabeli `plan_exercises` (Wymagany).
- **Request Body (JSON):**
  - Obiekt `UpdatePlanExerciseDto` (Partial).
  - Pola (wszystkie opcjonalne):
    - `sets` (string): np. "4"
    - `reps` (string): np. "8-10"
    - `weight` (string): np. "20kg"
    - `tempo` (string)
    - `rest` (string)
    - `notes` (string)
    - `sortOrder` (number)
  - **Uwaga:** Nie można zmienić `exerciseId` (zmiana ćwiczenia wymaga usunięcia i dodania nowego).

## 3. Wykorzystywane typy

### DTOs

- `UpdatePlanExerciseDto` (`backend/src/plan-exercises/dto/update-plan-exercise.dto.ts`)
  - Zgodnie ze specyfikacją typów: `extends PartialType(OmitType(CreatePlanExerciseDto, ['exerciseId']))`.
- `PlanExerciseResponseDto` (`backend/src/plan-exercises/dto/plan-exercise-response.dto.ts`).

### Encje

- `PlanExercise` (`backend/src/plan-exercises/entities/plan-exercise.entity.ts`).

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`.
- **Ciało odpowiedzi:** Zaktualizowany obiekt `PlanExerciseResponseDto`.

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `PATCH` z ID ćwiczenia w planie oraz polami do zmiany.
2.  **AuthGuard & RolesGuard** weryfikują tożsamość użytkownika i rolę `TRAINER`.
3.  **PlanExercisesController** odbiera żądanie i przekazuje je do serwisu.
4.  **PlanExercisesService**:
    a. Pobiera encję `PlanExercise` na podstawie `id`.
    b. Dołącza niezbędne relacje do weryfikacji uprawnień: `trainingUnit` -> `trainingPlan`.
    c. **Autoryzacja (Ownership):** Sprawdza, czy właścicielem planu jest zalogowany trener (`planExercise.trainingUnit.trainingPlan.trainerId === user.id`).
    d. Jeśli weryfikacja przebiegnie pomyślnie, aktualizuje pola encji dostarczonymi danymi.
    e. Zapisuje zmiany w bazie danych.
5.  Kontroler zwraca zmapowane DTO.

## 6. Względy bezpieczeństwa

- **Role-Based Access Control (RBAC):** Endpoint dostępny tylko dla roli `TRAINER`. Klienci nie mogą zmieniać parametrów treningowych (mają osobny endpoint do zaznaczania wykonania).
- **Resource Ownership:** Trener może edytować tylko ćwiczenia w swoich planach. Próba edycji ćwiczenia innego trenera musi zakończyć się błędem `403 Forbidden`.
- **Validation:** Standardowa walidacja typów i długości pól (np. max length dla `notes`).

## 7. Obsługa błędów

| Scenariusz                             | Kod HTTP                  | Komunikat błędu               |
| :------------------------------------- | :------------------------ | :---------------------------- |
| Nieprawidłowe ID lub dane w Body       | 400 Bad Request           | Validation failed...          |
| Brak tokenu                            | 401 Unauthorized          | Unauthorized                  |
| Brak roli Trenera                      | 403 Forbidden             | Forbidden resource            |
| Brak uprawnień do zasobu (inny trener) | 403 Forbidden             | You cannot edit this exercise |
| Nie znaleziono wpisu                   | 404 Not Found             | Plan exercise not found       |
| Błąd serwera                           | 500 Internal Server Error | Internal server error         |

## 8. Rozważania dotyczące wydajności

- Pobranie `PlanExercise` musi uwzględniać (joinować) tabele rodziców (`trainingUnit`, `trainingPlan`) w jednym zapytaniu, aby uniknąć dodatkowych round-tripów do bazy dla sprawdzenia uprawnień.

## 9. Etapy wdrożenia

1.  **Kontroler (`PlanExercisesController`):**
    - Utwórz kontroler w `backend/src/plan-exercises/plan-exercises.controller.ts`, jeśli jeszcze nie istnieje (lub dodaj metodę do istniejącego).
    - Zdefiniuj metodę `@Patch(':id')` z guardami `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(UserRole.TRAINER)`.
2.  **Serwis (`PlanExercisesService`):**
    - Dodaj metodę `update(id: string, updateDto: UpdatePlanExerciseDto, userId: string): Promise<PlanExerciseResponseDto>`.
    - Zaimplementuj logikę `findOne` z relacjami: `relations: ['trainingUnit', 'trainingUnit.trainingPlan']`.
    - Dodaj logikę walidacji `trainerId`.
    - Zaimplementuj aktualizację `Object.assign(entity, updateDto)` i zapis.
3.  **Testy:**
    - Testy jednostkowe sprawdzające poprawność aktualizacji.
    - Testy jednostkowe sprawdzające odrzucenie dostępu dla niepowołanego trenera.
    - Testy walidacji DTO (np. zbyt długie notatki).
