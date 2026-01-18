# REST API Plan - Training Plans Module

## 1. Zasoby

| Zasób | Tabela Bazy Danych | Opis |
| :--- | :--- | :--- |
| **Exercise** | `exercises` | Definicje ćwiczeń (systemowe i użytkownika). |
| **TrainingPlan** | `training_plans` | Nagłówek planu treningowego (przypisanie do klienta, status). |
| **TrainingUnit** | `training_units` | Jednostka treningowa (np. Dzień Treningowy) w ramach planu. |
| **PlanExercise** | `plan_exercises` | Konkretne wystąpienie ćwiczenia w planie z parametrami. |

---

## 2. Punkty końcowe

### A. Exercises (Baza Ćwiczeń)

**1. Pobierz listę ćwiczeń**
*   **Metoda:** `GET`
*   **URL:** `/exercises`
*   **Opis:** Pobiera listę ćwiczeń. Dla trenera zwraca ćwiczenia systemowe ORAZ utworzone przez niego.
*   **Parametry zapytania:**
    *   `search` (string, optional) - Wyszukiwanie po nazwie (partial match).
    *   `muscleGroup` (enum, optional) - Filtrowanie po partii mięśniowej.
*   **Odpowiedź JSON:** `Exercise[]`
*   **Kody sukcesu:** 200 OK.

**2. Utwórz ćwiczenie**
*   **Metoda:** `POST`
*   **URL:** `/exercises`
*   **Opis:** Dodaje nowe ćwiczenie do biblioteki trenera.
*   **Ładunek żądania JSON:**
    ```json
    {
      "name": "My Custom Exercise",
      "muscleGroup": "CHEST" // Enum: CHEST, BACK, etc.
    }
    ```
*   **Odpowiedź JSON:** Utworzony obiekt `Exercise`.
*   **Kody sukcesu:** 201 Created.
*   **Błędy:** 400 Bad Request (niepoprawne Enum).

**3. Usuń ćwiczenie (Soft Delete)**
*   **Metoda:** `DELETE`
*   **URL:** `/exercises/:id`
*   **Opis:** Oznacza ćwiczenie jako usunięte (`deletedAt`). Możliwe tylko dla ćwiczeń własnych trenera. Nie usuwa ćwiczenia z istniejących planów.
*   **Kody sukcesu:** 200 OK.
*   **Błędy:** 403 Forbidden (próba usunięcia ćwiczenia systemowego lub innego trenera).

---

### B. Training Plans (Plany Treningowe)

**1. Pobierz listę planów**
*   **Metoda:** `GET`
*   **URL:** `/training-plans`
*   **Opis:** Zwraca listę nagłówków planów.
    *   **Trener:** Widzi plany stworzone przez siebie. Może filtrować po `clientId`.
    *   **Klient:** Widzi tylko plany przypisane do siebie.
*   **Parametry zapytania:**
    *   `clientId` (UUID, optional) - Filtr dla trenera.
    *   `status` (enum: ACTIVE, ARCHIVED, optional).
*   **Odpowiedź JSON:** `TrainingPlan[]` (bez głębokiej struktury jednostek).
*   **Kody sukcesu:** 200 OK.

**2. Pobierz szczegóły planu**
*   **Metoda:** `GET`
*   **URL:** `/training-plans/:id`
*   **Opis:** Zwraca pełną strukturę planu wraz z jednostkami (`units`) i ćwiczeniami (`exercises`).
*   **Odpowiedź JSON:**
    ```json
    {
      "id": "...",
      "name": "Plan A",
      "status": "ACTIVE",
      "units": [
        {
          "id": "...",
          "name": "Push Day",
          "sortOrder": 0,
          "exercises": [
            {
              "id": "...",
              "exerciseId": "...",
              "exerciseName": "Bench Press", // Flattened from relation
              "sets": "4",
              "reps": "8-12",
              "isCompleted": false
            }
          ]
        }
      ]
    }
    ```
*   **Kody sukcesu:** 200 OK.

**3. Utwórz plan**
*   **Metoda:** `POST`
*   **URL:** `/training-plans`
*   **Opis:** Tworzy nagłówek nowego planu.
*   **Ładunek żądania JSON:**
    ```json
    {
      "name": "Strength Block 1",
      "clientId": "uuid-of-client",
      "description": "Optional notes"
    }
    ```
*   **Odpowiedź JSON:** Utworzony obiekt `TrainingPlan`.
*   **Kody sukcesu:** 201 Created.

**4. Aktualizuj nagłówek planu**
*   **Metoda:** `PATCH`
*   **URL:** `/training-plans/:id`
*   **Opis:** Aktualizacja nazwy, opisu lub statusu (np. archiwizacja).
*   **Ładunek żądania JSON:**
    ```json
    {
      "name": "New Name",
      "status": "ARCHIVED" // Opcjonalnie
    }
    ```
*   **Kody sukcesu:** 200 OK.

---

### C. Training Units (Zarządzanie strukturą - Jednostki)

**1. Dodaj jednostkę do planu**
*   **Metoda:** `POST`
*   **URL:** `/training-plans/:planId/units`
*   **Opis:** Dodaje nową, pustą jednostkę treningową (np. "Dzień 1").
*   **Ładunek żądania JSON:**
    ```json
    {
      "name": "Leg Day",
      "sortOrder": 1
    }
    ```
*   **Kody sukcesu:** 201 Created.

**2. Duplikuj jednostkę**
*   **Metoda:** `POST`
*   **URL:** `/training-units/:id/duplicate`
*   **Opis:** Kopiuje jednostkę wraz ze wszystkimi jej ćwiczeniami i parametrami w ramach tego samego planu.
*   **Kody sukcesu:** 201 Created.

**3. Aktualizuj jednostkę**
*   **Metoda:** `PATCH`
*   **URL:** `/training-units/:id`
*   **Opis:** Zmiana nazwy lub kolejności (`sortOrder`).
*   **Kody sukcesu:** 200 OK.

**4. Usuń jednostkę**
*   **Metoda:** `DELETE`
*   **URL:** `/training-units/:id`
*   **Opis:** Usuwa jednostkę i kaskadowo wszystkie przypisane do niej ćwiczenia w planie.
*   **Kody sukcesu:** 200 OK.

---

### D. Plan Exercises (Zarządzanie strukturą - Ćwiczenia)

**1. Dodaj ćwiczenie do jednostki**
*   **Metoda:** `POST`
*   **URL:** `/training-units/:unitId/exercises`
*   **Opis:** Dodaje ćwiczenie z biblioteki do konkretnej jednostki planu.
*   **Ładunek żądania JSON:**
    ```json
    {
      "exerciseId": "uuid",
      "sets": "3",
      "reps": "10",
      "weight": "20kg",
      "tempo": "2010",
      "rest": "60s",
      "notes": "Focus on form"
    }
    ```
*   **Kody sukcesu:** 201 Created.

**2. Aktualizuj parametry ćwiczenia (Trener)**
*   **Metoda:** `PATCH`
*   **URL:** `/plan-exercises/:id`
*   **Opis:** Edycja parametrów treningowych. Dostępne tylko dla trenera.
*   **Ładunek żądania JSON:**
    ```json
    {
      "sets": "4",
      "reps": "8"
      // Inne pola opcjonalne
    }
    ```
*   **Kody sukcesu:** 200 OK.

**3. Zmień status wykonania (Klient)**
*   **Metoda:** `PATCH`
*   **URL:** `/plan-exercises/:id/completion`
*   **Opis:** Przełączenie flagi `isCompleted`. Dostępne dla klienta.
*   **Ładunek żądania JSON:**
    ```json
    {
      "isCompleted": true
    }
    ```
*   **Kody sukcesu:** 200 OK.

**4. Usuń ćwiczenie z planu**
*   **Metoda:** `DELETE`
*   **URL:** `/plan-exercises/:id`
*   **Opis:** Usuwa pozycję z planu (nie z biblioteki).
*   **Kody sukcesu:** 200 OK.

---

## 3. Uwierzytelnianie i autoryzacja

Mechanizm oparty na istniejącym systemie CoachFlow (NestJS Guards + JWT).

1.  **AuthGuard**: Weryfikuje poprawność tokenu JWT.
2.  **RolesGuard**: Sprawdza rolę użytkownika (`TRAINER` lub `CLIENT`) używając dekoratora `@Roles()`.
3.  **OwnershipGuard (Resource Guards)**:
    *   Dla endpointów trenera: Sprawdza, czy modyfikowany plan/ćwiczenie należy do zalogowanego trenera (`where: { trainerId: user.id }`).
    *   Dla endpointów klienta: Sprawdza, czy plan jest przypisany do zalogowanego klienta (`where: { clientId: user.id }`).

## 4. Walidacja i logika biznesowa

**Warunki walidacji:**
1.  **Muscle Group**: Musi być jedną z wartości ENUM (`CHEST`, `BACK`, itp.).
2.  **Client Assignment**: Przy tworzeniu planu, `clientId` musi wskazywać na istniejącego użytkownika o roli `CLIENT`, który jest podopiecznym danego trenera (relacja biznesowa).
3.  **Plan Status**: Zmiana statusu dozwolona tylko na wartości z ENUM (`ACTIVE`, `ARCHIVED`).

**Logika biznesowa:**
1.  **Widoczność ćwiczeń**:
    *   Trener widzi sumę zbiorów: `exercises.isSystem = true` OR `exercises.trainerId = currentTrainerId`.
    *   Podczas usuwania ćwiczenia z biblioteki (`DELETE /exercises/:id`), rekord nie jest usuwany fizycznie (`SoftDelete`).
2.  **Historia Planów**:
    *   Pobierając plan (`GET /training-plans/:id`), system musi dołączyć dane ćwiczenia (`name`) nawet jeśli ćwiczenie źródłowe zostało usunięte (soft deleted). TypeORM query powinno używać `withDeleted: true` dla relacji `exercise`.
3.  **Live Updates**:
    *   Każda akcja (dodanie ćwiczenia, zmiana serii) jest atomowa i natychmiast zapisywana w bazie. Nie ma mechanizmu "Zapisz wersję roboczą" całego planu – plan jest budowany na żywo.
4.  **Uprawnienia Klienta**:
    *   Klient ma dostęp `READ-ONLY` do struktury planu (nie może dodawać/usuwać ćwiczeń).
    *   Klient ma dostęp `WRITE` wyłącznie do pola `isCompleted` w tabeli `plan_exercises`.
