# API Endpoint Implementation Plan: Delete Exercise

## 1. Przegląd punktu końcowego

Endpoint `DELETE /exercises/:id` służy do archiwizacji (soft delete) ćwiczenia. Operacja ta ustawia znacznik czasu w kolumnie `deletedAt`, co sprawia, że ćwiczenie znika z list wyboru dla nowych planów, ale pozostaje w bazie danych, zapewniając integralność historycznych planów treningowych, które z niego korzystają.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/exercises/:id`
- **Parametry ścieżki:**
    -   `id`: UUID ćwiczenia do usunięcia.
- **Nagłówki:**
    -   `Authorization`: Bearer <token_jwt>

## 3. Wykorzystywane typy

### DTOs
Brak ciała żądania. Wymagana jedynie walidacja UUID w parametrze ścieżki (`ParseUUIDPipe`).

## 4. Szczegóły odpowiedzi

**Kod statusu:** `200 OK`

**Ciało odpowiedzi (JSON):**
```json
{
  "success": true,
  "id": "uuid-usuniętego-ćwiczenia"
}
```
*Alternatywnie, jeśli framework/konwencja preferuje brak treści przy sukcesie usuwania, można zwrócić 204 No Content, ale specyfikacja API sugeruje 200 OK.*

## 5. Przepływ danych

1.  **Controller (`ExercisesController`)**:
    -   Odbiera żądanie `DELETE` z parametrem `id`.
    -   Pobiera `user` z kontekstu żądania.
    -   Wywołuje metodę `exercisesService.remove(id, user.id)`.

2.  **Service (`ExercisesService`)**:
    -   Pobiera ćwiczenie z bazy danych za pomocą `findOne`.
    -   **Krok Weryfikacji (Guard Clauses):**
        -   Jeśli ćwiczenie nie istnieje -> Rzuca `NotFoundException (404)`.
        -   Jeśli `exercise.isSystem === true` -> Rzuca `ForbiddenException (403)` z komunikatem "Cannot delete system exercises".
        -   Jeśli `exercise.trainerId !== userId` -> Rzuca `ForbiddenException (403)` z komunikatem "You can only delete your own exercises".
    -   Wykonuje operację `exercisesRepository.softRemove(exercise)` lub `softDelete(id)`.
    -   Zwraca potwierdzenie.

3.  **Database (PostgreSQL)**:
    -   Aktualizuje rekord: ustawia `deleted_at = NOW()` dla danego ID.
    -   Nie usuwa fizycznie wiersza.

## 6. Względy bezpieczeństwa

-   **Ochrona zasobów systemowych:** Absolutna blokada usuwania/modyfikacji rekordów z flagą `isSystem`.
-   **Izolacja danych:** Blokada usuwania zasobów należących do innych użytkowników (Tenant Isolation na poziomie wiersza).
-   **Referential Integrity:** Dzięki zastosowaniu Soft Delete, klucze obce w tabeli `plan_exercises` nie zostaną naruszone (historia treningów klienta pozostaje nienaruszona, nawet jeśli trener usunie ćwiczenie z biblioteki).

## 7. Obsługa błędów

| Scenariusz | Kod HTTP | Opis |
| :--- | :--- | :--- |
| Pomyślne usunięcie | 200 | Ćwiczenie oznaczone jako usunięte. |
| Ćwiczenie nie istnieje | 404 | Nie znaleziono ćwiczenia o podanym ID. |
| Próba usunięcia ćwiczenia systemowego | 403 | Forbidden. |
| Próba usunięcia ćwiczenia innego trenera | 403 | Forbidden. |
| Nieprawidłowy format UUID | 400 | Walidacja `ParseUUIDPipe`. |
| Brak tokenu | 401 | Unauthorized. |

## 8. Rozważania dotyczące wydajności

-   Operacja jest szybka (update po Primary Key).
-   TypeORM automatycznie filtruje rekordy z `deletedAt IS NOT NULL` przy standardowych zapytaniach `find`, więc usunięte ćwiczenia nie będą spowalniać pobierania listy dostępnych ćwiczeń.

## 9. Etapy wdrożenia

1.  **Implementacja w Serwisie**:
    -   W `backend/src/exercises/exercises.service.ts` dodać metodę `remove(id: string, userId: string): Promise<void>`.
    -   Dodać logikę pobrania encji i weryfikacji warunków (isSystem, trainerId).
    -   Użyć metody repozytorium do wykonania soft delete.

2.  **Implementacja w Kontrolerze**:
    -   W `backend/src/exercises/exercises.controller.ts` dodać metodę `@Delete(':id')`.
    -   Użyć `ParseUUIDPipe` dla parametru `id`.
    -   Obsłużyć zwracanie wyniku.

3.  **Weryfikacja**:
    -   Próba usunięcia własnego ćwiczenia (Sukces 200).
    -   Próba ponownego usunięcia tego samego ćwiczenia (Powinno zwrócić 404, ponieważ domyślny `findOne` ignoruje soft-deleted, lub 200 jeśli logika ma być idempotentna - w tym przypadku jednak standardem jest 404 dla "nie znaleziono aktywnego zasobu").
    -   Próba usunięcia ćwiczenia systemowego (Błąd 403).
    -   Próba usunięcia ćwiczenia innego trenera (stworzyć mock w DB) -> (Błąd 403).
