# API Endpoint Implementation Plan: GET /training-plans/:id

## 1. Przegląd punktu końcowego

Endpoint `GET /training-plans/:id` służy do pobierania szczegółowych informacji o konkretnym planie treningowym. W przeciwieństwie do listy planów, ten endpoint zwraca pełną, zagnieżdżoną strukturę danych, obejmującą jednostki treningowe (`training_units`) oraz przypisane do nich ćwiczenia (`plan_exercises` wraz z nazwami z `exercises`).

Dostęp do zasobu jest chroniony i kontekstowy:

- **Trener** może pobrać szczegóły tylko tych planów, których jest autorem (`trainerId`).
- **Klient** może pobrać szczegóły tylko tych planów, które są do niego przypisane (`clientId`).

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/training-plans/:id`
- **Parametry Ścieżki (Path Params):**
  - `id`: `UUID` (Wymagane) - Unikalny identyfikator planu treningowego.
- **Parametry Query:** Brak.
- **Request Body:** Brak.
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

Do implementacji niezbędne będą następujące elementy (zdefiniowane w `training-plans-types.md`):

- **DTO odpowiedzi (Główne):** `TrainingPlanDetailsResponseDto`
  - Pola nagłówka: `id`, `name`, `status`, `clientId`, `description` etc.
  - Pole relacji: `units` (Tablica `TrainingUnitResponseDto`).

- **DTO zagnieżdżone:**
  - `TrainingUnitResponseDto`: `id`, `name`, `sortOrder`, `exercises` (Tablica).
  - `PlanExerciseResponseDto`: `id`, `exerciseId`, `exerciseName` (spłaszczone), `sets`, `reps`, `weight`, `tempo`, `rest`, `notes`, `startOrder`, `isCompleted`.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Typ zawartości:** `application/json`
- **Struktura:** Obiekt `TrainingPlanDetailsResponseDto`.

Przykład:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Plan A",
  "status": "ACTIVE",
  "description": "Opis planu",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-20T10:00:00Z",
  "units": [
    {
      "id": "unit-uuid-1",
      "name": "Push Day",
      "sortOrder": 0,
      "exercises": [
        {
          "id": "plan-exercise-uuid-1",
          "exerciseId": "exercise-uuid-100",
          "exerciseName": "Bench Press",
          "sets": "4",
          "reps": "8-12",
          "weight": "80kg",
          "notes": null,
          "sortOrder": 0,
          "isCompleted": false
        }
      ]
    }
  ]
}
```

## 5. Przepływ danych

1.  **Controller (`TrainingPlansController`):**
    - Przechwytuje żądanie `GET /:id`.
    - Pobiera `id` z parametrów ścieżki (`@Param('id')`).
    - Pobiera użytkownika z obiektu żądania (`@User()`).
    - Wywołuje metodę serwisu `findOne(id, user)`.

2.  **Service (`TrainingPlansService`):**
    - Wywołuje metodę repozytorium `findOneWithDetails(id)`.
    - **Weryfikacja istnienia:** Jeśli plan nie istnieje -> rzuca `NotFoundException`.
    - **Weryfikacja uprawnień (Authorization Check):**
      - Jeśli user to `TRAINER`: sprawdza czy `plan.trainerId === user.id`.
      - Jeśli user to `CLIENT`: sprawdza czy `plan.clientId === user.id`.
      - Jeśli warunek niespełniony -> rzuca `NotFoundException` (dla bezpieczeństwa, aby nie zdradzać istnienia zasobu) lub `ForbiddenException`. Preferowane `NotFoundException` przy ścisłej kontroli dostępu do zasobów po ID.
    - Zwraca zmapowany obiekt `TrainingPlanDetailsResponseDto`.

3.  **Repository (`TrainingPlansRepository`):**
    - Metoda `findOneWithDetails(id)`.
    - Używa `QueryBuilder` lub `find` z opcjami:
      - `relations`: `['units', 'units.exercises', 'units.exercises.exercise']`.
      - `order`:
        - `units.sortOrder`: `ASC`
        - `units.exercises.sortOrder`: `ASC`
      - **Kluczowe:** `withDeleted: true` dla relacji `exercise`. Jeśli definicja ćwiczenia została usunięta (soft delete), nazwa ćwiczenia nadal musi być dostępna w planie.
    - Pobiera dane z bazy.

4.  **Database:**
    - `SELECT` z wielokrotnym `LEFT JOIN` (training_plans -> training_units -> plan_exercises -> exercises).

## 6. Względy bezpieczeństwa

- **Identyfikacja zasobu:** Walidacja czy `id` jest poprawnym UUID (`ParseUUIDPipe`).
- **Data Access Control:** Kluczowy aspekt tego endpointu. Użytkownik nie może uzyskać dostępu do planu, który nie jest "jego" (jako twórcy lub odbiorcy), nawet jeśli zna UUID.
- **Exposure:** Nie zwracamy wrażliwych danych trenera/klienta poza ich ID.

## 7. Obsługa błędów

- **400 Bad Request:** Nieprawidłowy format UUID.
- **401 Unauthorized:** Brak tokenu JWT.
- **403 Forbidden:** Użytkownik zalogowany, ale próbuje pobrać plan innego użytkownika (jeśli zdecydujemy się na ten kod błędu).
- **404 Not Found:** Plan o danym ID nie istnieje LUB użytkownik nie ma do niego praw (zalecane podejście).

## 8. Rozważania dotyczące wydajności

- **N+1 Query Problem:** Użycie `relations` w TypeORM lub jednego `QueryBuilder` z `leftJoinAndSelect` zapobiegnie problemowi N+1 zapytań przy pobieraniu jednostek i ćwiczeń.
- **Rozmiar odpowiedzi:** Przy bardzo rozbudowanych planach (wiele tygodni, dziesiątki jednostek) JSON może być duży. Na tym etapie (MVP) pobieramy całość. W przyszłości można rozważyć ładowanie jednostek na żądanie (lazy loading), ale dla typowego planu treningowego nie powinno to być konieczne.
- **Sortowanie:** Sortowanie (`ORDER BY`) powinno odbywać się na poziomie bazy danych dla `sortOrder`.

## 9. Etapy wdrożenia

1.  **Weryfikacja/Utworzenie DTO:**
    - Upewnij się, że `TrainingPlanDetailsResponseDto`, `TrainingUnitResponseDto`, `PlanExerciseResponseDto` są gotowe i poprawnie skonfigurowane (TypeORM/Class-Transformer).

2.  **Implementacja Repozytorium:**
    - Dodaj metodę `findOneWithDetails(id: string): Promise<TrainingPlan | null>`.
    - Skonfiguruj joine, sortowanie i obsługę `withDeleted` dla ćwiczeń.

3.  **Implementacja Serwisu:**
    - Metoda `findOne(id: string, user: User)`.
    - Pobranie danych.
    - Implementacja logiki sprawdzającej `trainerId` / `clientId`.
    - Mapowanie encji na DTO (uwaga na spłaszczenie `planExercise.exercise.name` -> `dto.exerciseName`).

4.  **Implementacja Kontrolera:**
    - Endpoint `@Get(':id')`.
    - Zastosowanie `ParseUUIDPipe`.

5.  **Testy:**
    - Testy jednostkowe serwisu (scenariusze: plan nie istnieje, brak dostępu, sukces dla trenera, sukces dla klienta).
    - Weryfikacja poprawności struktury JSON i kolejności sortowania.
