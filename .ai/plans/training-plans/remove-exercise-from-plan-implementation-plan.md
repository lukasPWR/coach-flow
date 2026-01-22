# API Endpoint Implementation Plan: Remove Exercise from Plan

## 1. Przegląd punktu końcowego

Punkt końcowy `DELETE /plan-exercises/:id` umożliwia trenerom usunięcie konkretnego ćwiczenia z planu treningowego. Operacja ta usuwa jedynie przypisanie ćwiczenia do jednostki treningowej (rekord w tabeli `plan_exercises`), nie wpływając na definicję ćwiczenia w bibliotece (`exercises`).

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/plan-exercises/:id`
- **Parametry URL:**
  - `id` (UUID): Unikalny identyfikator wpisu w `plan_exercises` (Wymagany).
- **Request Body:** Brak.

## 3. Wykorzystywane typy

### DTOs

Nie są wymagane żadne DTO wejściowe.

### Encje

- `PlanExercise` (`backend/src/plan-exercises/entities/plan-exercise.entity.ts`)

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Ciało odpowiedzi:** Puste lub proste potwierdzenie (zależnie od konwencji, np. `{ success: true }` lub po prostu status 200).

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `DELETE` z ID ćwiczenia planowego.
2.  **AuthGuard** weryfikuje token JWT.
3.  **RolesGuard** sprawdza, czy użytkownik ma rolę `TRAINER`.
4.  **PlanExercisesController** przekazuje żądanie do serwisu.
5.  **PlanExercisesService**:
    a. Pobiera encję `PlanExercise` na podstawie `id` wraz z relacjami `trainingUnit` -> `trainingPlan`.
    - _Uwaga:_ Warto użyć metody `findOne` z opcją `relations`.
      b. **Autoryzacja (Ownership):** Sprawdza, czy zalogowany trener jest właścicielem planu:
    - Warunek: `planExercise.trainingUnit.trainingPlan.trainerId === user.id`.
    - Jeśli nie: rzuca wyjątek `ForbiddenException`.
      c. Jeśli encja nie istnieje: rzuca `NotFoundException`.
      d. Wykonuje usunięcie rekordu z bazy danych (`repository.remove(entity)` lub `repository.delete(id)`).
6.  Zwraca kod 200.

## 6. Względy bezpieczeństwa

- **Role-Based Access Control (RBAC):** Endpoint dostępny tylko dla roli `TRAINER`. Klienci nie mogą usuwać ćwiczeń z planu.
- **Resource Ownership:** Trener może usuwać pozycje tylko z własnych planów. Zapobiega to przypadkowemu lub złośliwemu usunięciu danych innych użytkowników.

## 7. Obsługa błędów

| Scenariusz                            | Kod HTTP         | Komunikat błędu                      |
| :------------------------------------ | :--------------- | :----------------------------------- | ------------------------------- |
| Nieprawidłowe ID                      | 400 Bad Request  | Validation failed (uuid is expected) |
| Brak tokenu                           | 401 Unauthorized | Unauthorized                         |
| Brak roli Trenera                     | 403 Forbidden    | Forbidden resource                   |
| Próba usunięcia zasobu innego trenera | 403 Forbidden    | / 404 Not Found                      | You cannot delete this exercise |
| Nie znaleziono wpisu                  | 404 Not Found    | Plan exercise not found              |

## 8. Rozważania dotyczące wydajności

- Operacja usunięcia jest prosta.
- Należy upewnić się, że pobieranie do weryfikacji uprawnień jest optymalne (np. select tylko niezbędnych pól ID, jeśli to możliwe, chociaż ładowanie całych encji rodziców jest bezpieczniejsze i często wystarczająco szybkie przy pojedynczych rekordach).

## 9. Etapy wdrożenia

1.  **Serwis (`PlanExercisesService`):**
    - Dodaj metodę `remove(id: string, userId: string): Promise<void>`.
    - Zaimplementuj logikę: `findOne` -> sprawdź `trainerId` -> `repository.delete`.
2.  **Kontroler (`PlanExercisesController`):**
    - Dodaj metodę `@Delete(':id')`.
    - Pamiętaj o guardach: `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(UserRole.TRAINER)`.
    - Wywołaj serwis.
3.  **Testy:**
    - Test jednostkowy (Happy Path): Usunięcie istniejącego ćwiczenia przez właściciela.
    - Test jednostkowy (Forbidden): Próba usunięcia przez innego trenera.
    - Test jednostkowy (Not Found): Próba usunięcia nieistniejącego ID.
