# API Endpoint Implementation Plan: Toggle Plan Exercise Completion

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /plan-exercises/:id/completion` umożliwia klientom (podopiecznym) oznaczanie poszczególnych ćwiczeń w swoim planie treningowym jako wykonane (`isCompleted = true`) lub niewykonane. Jest to jedyna operacja modyfikacji planu dozwolona dla klientów.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/plan-exercises/:id/completion`
- **Parametry URL:**
  - `id` (UUID): Unikalny identyfikator ćwiczenia w planie (`PlanExercise`).
- **Request Body (JSON):**
  - Obiekt zawierający nowy status.
  - Wymagane pole: `isCompleted` (boolean).
  - Przykład:
    ```json
    {
      "isCompleted": true
    }
    ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

- **`TogglePlanExerciseCompletionDto`** (Nowy DTO)
  - Lokalizacja: `backend/src/plan-exercises/dto/toggle-plan-exercise-completion.dto.ts`
  - Pola: `isCompleted` (boolean, `@IsBoolean`, `@IsNotEmpty`).
  - _Uzasadnienie:_ Istniejący `UpdatePlanExerciseDto` jest przeznaczony dla trenerów i zawiera pola techniczne (serie, powtórzenia). Klienci powinni mieć dostęp wyłącznie do zmiany statusu.

### Encje

- `PlanExercise` (`backend/src/plan-exercises/entities/plan-exercise.entity.ts`)

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Ciało odpowiedzi:** Zaktualizowany obiekt `PlanExerciseResponseDto` (lub tylko status, zależnie od konwencji, ale zwrócenie całego obiektu ułatwia aktualizację UI po stronie klienta).

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `PATCH` ze statusem wykonania.
2.  **AuthGuard** weryfikuje token JWT.
3.  **RolesGuard** sprawdza, czy użytkownik ma rolę `CLIENT` (ewentualnie `TRAINER` też mógłby mieć taką możliwość, ale specyfikacja mówi: "Dostępne dla klienta").
4.  **PlanExercisesController** przekazuje żądanie do serwisu.
5.  **PlanExercisesService**:
    a. Pobiera encję `PlanExercise` na podstawie `id` wraz z relacjami `trainingUnit` -> `trainingPlan`.
    b. **Autoryzacja (Client Ownership):** Sprawdza, czy zalogowany użytkownik jest klientem przypisanym do tego planu:
    - Warunek: `planExercise.trainingUnit.trainingPlan.clientId === user.id`.
      c. Aktualizuje pole `isCompleted` wartością z DTO.
      d. Zapisuje zmiany w bazie danych.
6.  Zwraca zaktualizowane dane.

## 6. Względy bezpieczeństwa

- **Role-Based Access Control (RBAC):** Endpoint dedykowany dla roli `CLIENT`.
- **Resource Ownership:** Kluczowa weryfikacja `clientId`. Klient nie może oznaczać zadań w planach innych użytkowników, ani w planach, które nie są do niego przypisane.
- **Validation:** Ścisła walidacja boolean dla `isCompleted`.

## 7. Obsługa błędów

| Scenariusz                             | Kod HTTP         | Komunikat błędu         |
| :------------------------------------- | :--------------- | :---------------------- | ------------------------------- |
| Nieprawidłowe ID lub Body              | 400 Bad Request  | Validation failed...    |
| Brak tokenu                            | 401 Unauthorized | Unauthorized            |
| Użytkownik nie jest klientem           | 403 Forbidden    | Forbidden resource      |
| Próba edycji ćwiczenia z cudzego planu | 403 Forbidden    | / 404 Not Found         | You cannot access this exercise |
| Nie znaleziono ćwiczenia               | 404 Not Found    | Plan exercise not found |

## 8. Rozważania dotyczące wydajności

- Podobnie jak w przypadku edycji przez trenera, pobranie musi uwzględniać relacje (`trainingPlan`) w jednym zapytaniu, aby uniknąć problemu N+1 podczas autoryzacji.

## 9. Etapy wdrożenia

1.  **Utwórz DTO:**
    - Stwórz plik `backend/src/plan-exercises/dto/toggle-plan-exercise-completion.dto.ts`.
    - Zdefiniuj klasę z polem `isCompleted` i dekoratorami walidacji (`class-validator`).
2.  **Implementacja Metody w Serwisie:**
    - Dodaj metodę `toggleCompletion(id: string, dto: TogglePlanExerciseCompletionDto, userId: string): Promise<PlanExerciseResponseDto>` w `PlanExercisesService`.
    - Zaimplementuj logikę pobierania z relacjami: `relations: ['trainingUnit', 'trainingUnit.trainingPlan']`.
    - Dodaj logikę weryfikacji: `if (entity.trainingUnit.trainingPlan.clientId !== userId) throw new ForbiddenException(...)`.
    - Zapisz zmianę.
3.  **Implementacja Endpointu w Kontrolerze:**
    - Dodaj metodę `@Patch(':id/completion')` w `PlanExercisesController`.
    - Użyj `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(UserRole.CLIENT)`.
    - Pobierz `user.id` i wywołaj serwis.
4.  **Testy:**
    - Unit testy: Klient może zmienić status własnego ćwiczenia.
    - Unit testy: Klient nie może zmienić statusu ćwiczenia innego klienta.
    - E2E testy: Pełna ścieżka HTTP.
