# API Endpoint Implementation Plan: Update Training Unit

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /training-units/:id` służy do aktualizacji podstawowych informacji o jednostce treningowej, takich jak jej nazwa (`name`) oraz kolejność w planie (`sortOrder`). Operacja ta umożliwia trenerom modyfikację struktury planu treningowego.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/training-units/:id`
- **Parametry URL:**
  - `id` (UUID): Unikalny identyfikator jednostki treningowej do zaktualizowania (Wymagany).
- **Request Body (JSON):**
  - Obiekt zawierający pola do aktualizacji (Partial).
  - Przykładowa struktura:
    ```json
    {
      "name": "Nowa nazwa jednostki",
      "sortOrder": 2
    }
    ```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

Pliki te zostały już zdefiniowane w module `training-units` (wg `training-plans-types.md`):

1.  **`UpdateTrainingUnitDto`** (`backend/src/training-units/dto/update-training-unit.dto.ts`)
    - Używany do walidacji przychodzącego `body`.
    - Pola:
      - `name?`: string (opcjonalne)
      - `sortOrder?`: number (opcjonalne)
    - Walidacja: Dziedziczy po `CreateTrainingUnitDto` przy użyciu `PartialType`.

2.  **`TrainingUnitResponseDto`** (`backend/src/training-units/dto/training-unit-response.dto.ts`)
    - Używany do zwrócenia zaktualizowanego obiektu.

### Encje

- `TrainingUnit` (`backend/src/training-units/entities/training-unit.entity.ts`)

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Ciało odpowiedzi:** Zaktualizowany obiekt `TrainingUnitResponseDto`.
  ```json
  {
    "id": "uuid",
    "name": "Nowa nazwa jednostki",
    "sortOrder": 2,
    "exercises": [...] // Opcjonalnie lista ćwiczeń, jeśli logika to uwzględnia, ale PATCH zazwyczaj zwraca zaktualizowany zasób
  }
  ```

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `PATCH` z `id` jednostki i danymi do zmiany.
2.  **AuthGuard** weryfikuje token JWT użytkownika.
3.  **RolesGuard** sprawdza, czy użytkownik ma rolę `TRAINER` (tylko trenerzy mogą modyfikować strukturę planu).
4.  **TrainingUnitsController** odbiera żądanie, waliduje DTO (`UpdateTrainingUnitDto`) i przekazuje je do serwisu.
5.  **TrainingUnitsService** wykonuje logikę biznesową:
    a. Pobiera jednostkę z bazy danych na podstawie `id`.
    b. **Autoryzacja zasobów:** Sprawdza, czy zalogowany trener jest właścicielem planu, do którego należy ta jednostka.
    - Pobranie jednostki wraz z relacją `trainingPlan`.
    - Weryfikacja: `unit.trainingPlan.trainerId === user.id`.
      c. Jeśli `sortOrder` jest aktualizowany, serwis może (opcjonalnie) wymagać przenumerowania innych jednostek w tym samym planie (chyba że frontend obsługuje to wysyłając batch update, ale tutaj specyfikacja mówi o pojedynczym update). _Na tym etapie zmieniamy tylko wartość dla tej konkretnej jednostki._
      d. Wykonuje aktualizację w bazie danych (używając repozytorium).
6.  **TrainingUnitsService** zwraca zaktualizowaną encję.
7.  **TrainingUnitsController** mapuje encję na `TrainingUnitResponseDto` i zwraca odpowiedź.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wymagany ważny token JWT.
- **Autoryzacja ról:** Dostęp tylko dla roli `TRAINER`. Klienci nie mogą zmieniać nazw ani kolejności jednostek.
- **Autoryzacja zasobów (Ownership):** Kluczowy punkt bezpieczeństwa. Trener nie może edytować jednostki należącej do planu innego trenera. Należy sprawdzić `trainerId` w powiązanym `TrainingPlan`.
- **Walidacja danych:**
  - `name`: ciąg znaków, niepusty, max 255 znaków (jeśli podano).
  - `sortOrder`: liczba całkowita, nieujemna (jeśli podano).
  - Walidacja `id` jako UUID (ParseUUIDPipe).

## 7. Obsługa błędów

| Scenariusz                                   | Kod HTTP                  | Komunikat błędu                         |
| :------------------------------------------- | :------------------------ | :-------------------------------------- | --------------------------------------------------------------- |
| Nieprawidłowy format ID                      | 400 Bad Request           | Validation failed (uuid is expected)    |
| Nieprawidłowe dane w body (np. pusty `name`) | 400 Bad Request           | Validation error messages...            |
| Brak tokenu / nieważny token                 | 401 Unauthorized          | Unauthorized                            |
| Użytkownik nie jest trenerem                 | 403 Forbidden             | Forbidden resource                      |
| Próba edycji jednostki innego trenera        | 403 Forbidden             | / 404 Not Found                         | You do not have permission to update this unit / Unit not found |
| Jednostka nie istnieje                       | 404 Not Found             | Training unit with ID "${id}" not found |
| Błąd bazy danych                             | 500 Internal Server Error | Internal server error                   |

## 8. Rozważania dotyczące wydajności

- Pobranie jednostki powinno odbywać się po kluczu głównym (`id`).
- Należy upewnić się, że pobieranie relacji `trainingPlan` (do sprawdzenia uprawnień) jest zoptymalizowane (join).
- Aktualizacja powinna dotyczyć tylko zmieniowych kolumn (`patch`).

## 9. Etapy wdrożenia

1.  **Weryfikacja DTO:** Upewnij się, że `UpdateTrainingUnitDto` w `backend/src/training-units/dto/update-training-unit.dto.ts` jest poprawnie zaimplementowany (extends PartialType).
2.  **Implementacja Metody w Serwisie:**
    - Dodaj metodę `update(id: string, updateTrainingUnitDto: UpdateTrainingUnitDto, userId: string): Promise<TrainingUnitResponseDto>` w `TrainingUnitsService`.
    - Zaimplementuj pobieranie jednostki z `trainingPlan` i sprawdzenie uprawnień (`unit.trainingPlan.trainerId === userId`).
    - Zaimplementuj logikę zapisu zmian.
3.  **Implementacja Endpointu w Kontrolerze:**
    - Dodaj metodę `@Patch(':id')` w `TrainingUnitsController`.
    - Użyj dekoratorów: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.TRAINER)`.
    - Wywołaj serwis przekazując `user.id` z requestu.
4.  **Testy:**
    - Napisz testy jednostkowe dla serwisu (happy path, brak uprawnień, nieznaleziony element).
    - (Opcjonalnie) Testy E2E dla endpointu.
