# API Endpoint Implementation Plan: POST /training-units/:id/duplicate

## 1. Przegląd punktu końcowego

Endpoint `POST /training-units/:id/duplicate` umożliwia trenerom szybkie kopiowanie istniejącej jednostki treningowej (razem ze wszystkimi zawartymi w niej ćwiczeniami). Nowa jednostka zostaje dodana do tego samego planu treningowego, co jednostka źródłowa, zazwyczaj na koniec listy.

**Zasada działania:**

1.  Pobierz jednostkę źródłową (`TrainingUnit`) wraz z jej ćwiczeniami (`PlanExercise`).
2.  Utwórz pustą kopię jednostki (`name` = np. "Kopia - [Oryginalna nazwa]", `trainingPlanId` = to samo).
3.  Zduplikuj każde ćwiczenie z jednostki źródłowej i przypisz je do nowej jednostki.
4.  Zapisz wszystko atomowo (transakcja).

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/training-units/:id/duplicate`
- **Parametry Ścieżki:**
  - `id`: `UUID` (Wymagane) - ID jednostki do skopiowania.
- **Parametry Query:** Brak.
- **Request Body:** Brak (opcjonalnie można dodać możliwość zmiany nazwy już przy duplikacji, ale specyfikacja tego nie wymaga).
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

- **DTO Odpowiedzi:** `TrainingUnitResponseDto` (Z pełną strukturą zduplikowanej jednostki - ćwiczenia).
- **Zasób:** `training_units`, `plan_exercises`.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `201 Created`
- **Typ zawartości:** `application/json`
- **Struktura:** Obiekt `TrainingUnitResponseDto` reprezentujący nowo utworzoną jednostkę.

Przykład:

```json
{
  "id": "new-unit-uuid",
  "name": "Dzień 1 - Kopia",
  "sortOrder": 5, // Kolejny wolny numer
  "exercises": [
    {
      "id": "new-exercise-uuid",
      "exerciseId": "original-exercise-id",
      "exerciseName": "Bench Press",
      "sets": "4",
      "reps": "8",
      ...
    }
  ]
}
```

## 5. Przepływ danych

1.  **Controller (`TrainingUnitsController`):**
    - Przechwytuje żądanie `POST /:id/duplicate`.
    - Sprawdza rolę (`TRAINER`).
    - Wywołuje serwis z `unitId` i `user`.

2.  **Service (`TrainingUnitsService`):**
    - **Pobranie:** Pobiera jednostkę źródłową używając `findOne` z relacjami `['planExercises', 'trainingPlan']`.
    - **Weryfikacja:**
      - Jeśli jednostka nie istnieje -> `404 Not Found`.
      - Jeśli plan trenera != user.id -> `403 Forbidden` / `404 Not Found`.
    - **Przygotowanie danych:**
      - Ustala `newSortOrder` (max dla planu + 1).
      - Tworzy obiekt nowej jednostki.
    - **Transakcja:**
      - Zapisuje nową jednostkę.
      - Iteruje po `sourceUnit.planExercises` i dla każdego tworzy kopię (omijając `id`, `createdAt` itp.) przypisaną do nowej jednostki.
      - Zapisuje skopiowane ćwiczenia.
    - **Mapowanie:** Zwraca pełne DTO nowej jednostki.

3.  **Repository (`TrainingUnitsRepository` & `PlanExercisesRepository`):**
    - Operacje DB muszą być wykonane w ramach transakcji (`DataSource.transaction` lub `queryRunner`), aby zapewnić spójność.

4.  **Database:**
    - `INSERT INTO training_units ...`
    - `INSERT INTO plan_exercises ...` (x ilość ćwiczeń)

## 6. Względy bezpieczeństwa

- **Autoryzacja właściciela:** Kluczowe jest sprawdzenie, czy jednostka faktycznie należy do planu stworzonego przez zalogowanego trenera.
- Dostęp tylko dla roli `TRAINER`.

## 7. Obsługa błędów

- **404 Not Found:** Jednostka źródłowa nie istnieje.
- **403 Forbidden:** Próba skopiowania jednostki innego trenera.
- **500 Internal Server Error:** Błąd transakcji bazy danych.

## 8. Rozważania dotyczące wydajności

- Operacja kopiowania "głębokiego" (jednostka + ćwiczenia).
- Dla typowej jednostki (5-10 ćwiczeń) jest to bardzo szybka operacja.
- Zalecane użycie transakcji bazodanowej.

## 9. Etapy wdrożenia

1.  **Serwis:**
    - Metoda `duplicate(unitId: string, userId: string): Promise<TrainingUnitResponseDto>`.
    - Implementacja z użyciem `DataSource` do obsługi transakcji:
      ```typescript
      await this.dataSource.transaction(async (manager) => {
        // 1. Get original
        // 2. Insert new Unit
        // 3. Bulk insert exercises with new UnitID
      })
      ```
2.  **Kontroler:**
    - Endpoint `@Post(':id/duplicate')`.
    - Ochrona `@Roles(Role.TRAINER)`.

3.  **Testy:**
    - Test: Duplikacja jednostki z 3 ćwiczeniami -> sprawdzenie czy powstała nowa jednostka i 3 nowe rekordy ćwiczeń.
    - Test: Duplikacja jednostki pustej.
    - Test: Weryfikacja własności.
