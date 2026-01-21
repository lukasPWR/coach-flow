# API Endpoint Implementation Plan: GET /training-plans

## 1. Przegląd punktu końcowego

Endpoint `GET /training-plans` umożliwia pobranie listy planów treningowych. Logika działania jest kontekstowa i zależy od roli zalogowanego użytkownika:

- **Trenerzy** otrzymują listę planów, które stworzyli. Mogą dodatkowo filtrować listę, aby zobaczyć plany przypisane do konkretnego klienta.
- **Klienci** otrzymują wyłącznie listę planów przypisanych do nich.
  Zwracane dane zawierają podstawowe informacje o planie (nagłówek), bez szczegółowej struktury jednostek treningowych i ćwiczeń.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/training-plans`
- **Parametry Query (Opcjonalne):**
  - `clientId`: `UUID` - ID klienta (używane tylko przez trenera do filtrowania wyników).
  - `status`: `PlanStatus` (`ACTIVE` | `ARCHIVED`) - Status planu.
- **Request Body:** Brak.
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

Do implementacji niezbędne będą następujące elementy (zdefiniowane w `training-plans-types.md`):

- **DTO zapytania:** `TrainingPlanQueryDto`
  - `clientId?: string` (`@IsOptional`, `@IsUUID`)
  - `status?: PlanStatus` (`@IsOptional`, `@IsEnum`)
- **DTO odpowiedzi:** `TrainingPlanResponseDto` (używane w tablicy)
  - `id`, `name`, `description`, `status`, `clientId`, `trainerId`, `createdAt`, `updatedAt`.
- **Enum:** `PlanStatus` (`ACTIVE`, `ARCHIVED`).
- **Interfejs filtrów:** `TrainingPlanFilters` (do przekazywania parametrów do repozytorium).

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Typ zawartości:** `application/json`
- **Struktura:** Tablica obiektów `TrainingPlanResponseDto`.

Przykład:

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "trainerId": "user-uuid-1",
    "clientId": "user-uuid-2",
    "name": "Plan na masę",
    "description": "Cykl zimowy",
    "status": "ACTIVE",
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": "2026-01-20T10:00:00Z"
  }
]
```

## 5. Przepływ danych

1.  **Controller (`TrainingPlansController`):**
    - Przechwytuje żądanie `GET`.
    - Wyciąga obiekt użytkownika (`request.user`) z tokenu JWT.
    - Przekazuje obiekt użytkownika oraz DTO `TrainingPlanQueryDto` do serwisu.

2.  **Service (`TrainingPlansService`):**
    - Analizuje rolę użytkownika (Trener vs Klient).
    - Buduje obiekt filtrów (`TrainingPlanFilters`):
      - Jeśli użytkownik to **Trener**: ustawia `trainerId` na ID użytkownika. Jeśli w DTO podano `clientId`, dodaje go do filtrów.
      - Jeśli użytkownik to **Klient**: ustawia `clientId` na ID użytkownika (ignoruje `clientId` z DTO).
      - Przepisuje filtr `status`, jeśli jest obecny.
    - Wywołuje metodę repozytorium, np. `findAllByFilters`.
    - Mapuje zwrócone encje na `TrainingPlanResponseDto` (lub używa serializacji ClassSerializer).

3.  **Repository (`TrainingPlansRepository`):**
    - Tworzy zapytanie do tabeli `training_plans` (np. za pomocą `QueryBuilder` lub `find`).
    - Aplikuje warunki `WHERE` na podstawie przekazanych filtrów.
    - Zwraca listę encji `TrainingPlan`.

4.  **Database:**
    - Wykonanie zapytania `SELECT` z odpowiednimi warunkami.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wymagany poprawny token JWT (użycie `JwtAuthGuard`).
- **Autoryzacja (Data Scoping):**
  - Logika w serwisie **musi** gwarantować, że użytkownik nie zobaczy danych, do których nie ma praw.
  - Klient nigdy nie może zobaczyć planów innego klienta (wymuszenie filtru po jego ID).
  - Trener widzi tylko plany utworzone przez siebie (wymuszenie filtru po jego ID).
- **Walidacja Inputu:** Parametry `clientId` i `status` są walidowane przez `ValidationPipe`.

## 7. Obsługa błędów

- **400 Bad Request:** Jeśli `clientId` nie jest poprawnym UUID lub `status` nie jest zgodny z enumem (obsługiwane automatycznie przez `ValidationPipe`).
- **401 Unauthorized:** Brak lub nieprawidłowy token JWT.
- **500 Internal Server Error:** Nieoczekiwany błąd bazy danych (np. utrata połączenia).

## 8. Rozważania dotyczące wydajności

- **Indeksowanie:** Tabela `training_plans` powinna posiadać indeksy na kolumnach często używanych w `WHERE`: `trainerId`, `clientId`, `status` (zgodnie z planem bazy danych).
- **Zakres danych:** Endpoint zwraca tylko nagłówki planów (tabela `training_plans`), nie wykonuje `JOIN` do tabel podrzędnych (`training_units`, `plan_exercises`), co zapewnia bardzo wysoką wydajność nawet przy dużej liczbie planów.
- **Paginacja:** W obecnej specyfikacji brak paginacji. Przy dużej liczbie planów w przyszłości warto rozważyć dodanie `limit`/`offset`.

## 9. Etapy wdrożenia

1.  **Weryfikacja/Utworzenie plików DTO i Enum:**
    - Upewnij się, że `TrainingPlanQueryDto`, `TrainingPlanResponseDto` i `PlanStatus` istnieją w module `training-plans` i mają poprawne dekoratory.
    - Jeśli ich nie ma, utwórz je zgodnie z `training-plans-types.md`.

2.  **Implementacja Repozytorium:**
    - W pliku repozytorium (`training-plans.repository.ts`) dodaj metodę do pobierania planów z filtrowaniem. Np. `findAll(filters: TrainingPlanFilters): Promise<TrainingPlan[]>`.

3.  **Implementacja Serwisu:**
    - W `TrainingPlansService` zaimplementuj metodę `findAll(user: User, query: TrainingPlanQueryDto)`.
    - Zaimplementuj logikę rozróżniania ról i budowania filtrów.

4.  **Implementacja Kontrolera:**
    - W `TrainingPlansController` dodaj metodę obsugującą `GET /training-plans`.
    - Użyj dekoratorów `@Get()`, `@UseGuards(JwtAuthGuard)`, `@Query()`.
    - Podepnij dokumentację Swagger (`@ApiOperation`, `@ApiResponse`, `@ApiQuery`).

5.  **Testy:**
    - Dodaj testy jednostkowe dla serwisu (sprawdzenie logiki filtracji dla trenera i klienta).
    - (Opcjonalnie) Test E2E sprawdzający endpoint.
