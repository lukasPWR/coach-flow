# API Endpoint Implementation Plan: POST /training-plans/:planId/units

## 1. Przegląd punktu końcowego

Endpoint `POST /training-plans/:planId/units` służy do dodawania nowej jednostki treningowej (np. "Dzień A", "Push") do istniejącego planu treningowego.

**Zasada działania:**

- Tworzy nowy rekord w tabeli `training_units`.
- Jednostka jest pusta (nie zawiera jeszcze ćwiczeń).
- Przypisuje jednostkę do planu wskazanego przez `planId`.
- Dostępne tylko dla trenera, który jest właścicielem planu.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/training-plans/:planId/units`
- **Parametry Ścieżki:**
  - `planId`: `UUID` (Wymagane) - ID planu treningowego.
- **Parametry Query:** Brak.
- **Request Body (JSON):**
  - `name`: `string` (Wymagane, max 255) - Nazwa jednostki.
  - `sortOrder`: `number` (Opcjonalne, min 0) - Kolejność wyświetlania. Jeśli nie podano, system powinien wyliczyć kolejny numer (np. max + 1).
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

Do implementacji niezbędne będą następujące elementy (zdefiniowane w `training-plans-types.md`):

- **DTO:** `CreateTrainingUnitDto`
  - `name`: `@IsString`, `@IsNotEmpty`, `@MaxLength(255)`
  - `sortOrder`: `@IsOptional`, `@IsInt`, `@Min(0)`
- **DTO Odpowiedzi:** `TrainingUnitResponseDto`.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `201 Created`
- **Typ zawartości:** `application/json`
- **Struktura:** Obiekt `TrainingUnitResponseDto` (utworzona jednostka).

Przykład:

```json
{
  "id": "unit-uuid-123",
  "name": "Leg Day",
  "sortOrder": 1,
  "exercises": [] // Pusta tablica
}
```

## 5. Przepływ danych

1.  **Controller (`TrainingPlansController`):**
    - Przechwytuje żądanie `POST /:planId/units`.
    - Sprawdza rolę (`TRAINER`).
    - Przekazuje `planId`, `dto` i `user` do serwisu.
    - _Uwaga architektoniczna:_ Ponieważ endpoint dotyczy zasobu `Unit`, ale ścieżka jest pod `Plan`, kontroler planów może delegować logikę do `TrainingUnitsService`.

2.  **Service (`TrainingUnitsService` lub `TrainingPlansService` -> `TrainingUnitsService`):**
    - **Weryfikacja Planu:** Sprawdza czy plan o `planId` istnieje.
    - **Weryfikacja Uprawnień:** Sprawdza czy `plan.trainerId === user.id`.
    - **Logika Sortowania (jeśli brak sortOrder):** Oblicza `MAX(sortOrder) + 1` dla tego planu.
    - **Tworzenie:** Tworzy encję `TrainingUnit` powiązaną z planem.
    - **Zapis:** `trainingUnitsRepository.save()`.
    - **Mapowanie:** Zwraca `TrainingUnitResponseDto`.

3.  **Repository (`TrainingUnitsRepository`):**
    - `save(entity)`: INSERT.
    - `count({ where: { trainingPlanId: planId } })` lub query builder do znalezienia max order (potrzebne do automatycznego sortowania).

4.  **Database:**
    - `INSERT INTO training_units ...`

## 6. Względy bezpieczeństwa

- **Identyfikacja:** `planId` musi być UUID.
- **Autoryzacja:** Trener może dodawać jednostki _tylko_ do swoich planów. Próba dodania do cudzego planu -> `403 Forbidden` / `404 Not Found`.

## 7. Obsługa błędów

- **400 Bad Request:** Błędy walidacji (brak nazwy, ujemny sortOrder).
- **401 Unauthorized:** Brak tokenu.
- **404 Not Found:** Plan o podanym ID nie istnieje lub brak dostępu.

## 8. Rozważania dotyczące wydajności

- Jeśli `sortOrder` nie jest podany, wymagane jest dodatkowe zapytanie `SELECT MAX(sortOrder)`. Jest to szybkie dzięki indeksowi na `trainingPlanId` (zdefiniowanemu w planie bazy).

## 9. Etapy wdrożenia

1.  **DTO:**
    - Upewnij się, że `CreateTrainingUnitDto` i `TrainingUnitResponseDto` istnieją w module `training-units` (lub są eksportowane).

2.  **Serwis (TrainingUnitsService):**
    - Zaimplementuj metodę `create(planId: string, dto: CreateTrainingUnitDto, userId: string): Promise<TrainingUnitResponseDto>`.
    - Wstrzyknij `TrainingPlansRepository` (lub serwis) aby sprawdzić własność planu.
    - Zaimplementuj logikę `sortOrder`.

3.  **Kontroler (TrainingPlansController):**
    - Dodaj metodę `@Post(':planId/units')`.
    - Wstrzyknij `TrainingUnitsService`.
    - Wywołaj metodę `create`.

4.  **Testy:**
    - Test: Dodanie jednostki z jawnym sortOrder.
    - Test: Dodanie jednostki bez sortOrder (autonumeracja).
    - Test: Próba dodania do nie swojego planu.
