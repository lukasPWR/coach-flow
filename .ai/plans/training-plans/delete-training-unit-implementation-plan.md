# API Endpoint Implementation Plan: Delete Training Unit

## 1. Przegląd punktu końcowego

Punkt końcowy `DELETE /training-units/:id` umożliwia trenerom usunięcie jednostki treningowej (np. "Dzień A") z planu treningowego. Operacja ta jest destrukcyjna i powoduje kaskadowe usunięcie wszystkich ćwiczeń przypisanych do tej jednostki.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/training-units/:id`
- **Parametry URL:**
  - `id` (UUID): Unikalny identyfikator usuwanej jednostki treningowej (Wymagany).
- **Request Body:** Brak.

## 3. Wykorzystywane typy

### DTOs

Nie są wymagane dedykowane DTO dla żądania, ponieważ przesyłane jest tylko `id` w URL.
Można wykorzystać generyczny obiekt odpowiedzi lub po prostu status HTTP. W tym przypadku planujemy zwrócić proste potwierdzenie lub pustą odpowiedź.

### Encje

- `TrainingUnit` (`backend/src/training-units/entities/training-unit.entity.ts`)

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK` (Można też użyć `204 No Content`, ale specyfikacja API mówi o `200 OK`).
- **Ciało odpowiedzi:** Opcjonalnie może zwrócić usunięty obiekt lub komunikat sukcesu.
  ```json
  {
    "message": "Training unit deleted successfully",
    "id": "uuid-usuniętej-jednostki"
  }
  ```
  Zgodnie ze standardem CoachFlow, często zwracamy po prostu `200 OK` lub `void`.

## 5. Przepływ danych

1.  **Klient** wysyła żądanie `DELETE` z `id` jednostki.
2.  **AuthGuard** weryfikuje token JWT.
3.  **RolesGuard** sprawdza, czy użytkownik ma rolę `TRAINER`.
4.  **TrainingUnitsController** odbiera żądanie i przekazuje `id` oraz `userId` do serwisu.
5.  **TrainingUnitsService**:
    a. Pobiera jednostkę z bazy danych wraz z relacją `trainingPlan`.
    b. **Autoryzacja zasobów:** Sprawdza, czy zalogowany trener jest właścicielem planu (`unit.trainingPlan.trainerId === user.id`). Jeśli nie -> błąd 403.
    c. Jeśli jednostka nie istnieje -> błąd 404.
    d. Wykonuje operację usunięcia (`repository.remove()` lub `repository.delete()`).
    - **Kaskadowość:** Ponieważ w bazie danych relacja `training_units` -> `plan_exercises` powinna być skonfigurowana z `ON DELETE CASCADE` (w definicji TypeORM entity), usunięcie jednostki automatycznie usunie powiązane ćwiczenia. Jeśli nie jest to skonfigurowane w DB, TypeORM powinien obsłużyć to po stronie aplikacji (`cascade: true` w relacji) lub należy to zrobić ręcznie. Plan DB nie wspominał explicite o `ON DELETE CASCADE` dla `training_units` -> `plan_exercises` w sekcji SQL, ale w sekcji "2. Relacje" wspomniano o `training_units` -> `training_plans`, a dla jednostek "Usuwa jednostkę i kaskadowo wszystkie przypisane do niej ćwiczenia".
    - _Zalecenie:_ Upewnić się, że encja `TrainingUnit` ma `OneToMany` do `PlanExercise` z `cascade: ['remove']` lub `onDelete: 'CASCADE'`.
6.  Zwraca potwierdzenie sukcesu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wymagany Bearer Token.
- **Autoryzacja Roli:** Tylko `TRAINER` może usuwać jednostki.
- **Własność (Ownership):** Krytyczne sprawdzenie, czy jednostka należy do planu stworzonego przez uwierzytelnionego trenera.

## 7. Obsługa błędów

| Scenariusz                       | Kod HTTP                      | Komunikat błędu                         |
| :------------------------------- | :---------------------------- | :-------------------------------------- |
| Nieprawidłowy format ID          | 400 Bad Request               | Validation failed (uuid is expected)    |
| Brak tokenu                      | 401 Unauthorized              | Unauthorized                            |
| Brak uprawnień roli              | 403 Forbidden                 | Forbidden resource                      |
| Próba usunięcia cudzej jednostki | 403 Forbidden / 404 Not Found | You cannot delete this unit             |
| Jednostka nie znaleziona         | 404 Not Found                 | Training unit with ID "${id}" not found |
| Błąd serwera/bazy                | 500 Internal Server Error     | Internal server error                   |

## 8. Rozważania dotyczące wydajności

- Operacja usunięcia jest stosunkowo szybka, o ile kaskadowość jest obsługiwana przez silnik bazy danych (najwydajniej).
- Jeśli kaskadowość jest obsługiwana przez TypeORM (loading child entities and deleting one by one), może to generować więcej zapytań SQL. Zalecane jest `onDelete: 'CASCADE'` w definicji kolumny (`@ManyToOne` w `PlanExercise` entity).

## 9. Etapy wdrożenia

1.  **Weryfikacja Encji:** Sprawdź w `backend/src/plan-exercises/entities/plan-exercise.entity.ts`, czy relacja do `TrainingUnit` ma ustawione `onDelete: 'CASCADE'`. Jeśli nie, dodaj to, aby zapewnić spójność danych i wydajność.
2.  **Implementacja Metody w Serwisie:**
    - Dodaj metodę `remove(id: string, userId: string): Promise<void>` w `TrainingUnitsService`.
    - Zaimplementuj pobranie jednostki (`findOne` z relacją `trainingPlan`) i sprawdzenie `trainerId`.
    - Wywołaj `repository.remove(unit)` lub `repository.delete(id)`.
3.  **Implementacja Endpointu w Kontrolerze:**
    - Dodaj metodę `@Delete(':id')` w `TrainingUnitsController`.
    - Użyj dekoratorów `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(UserRole.TRAINER)`.
    - Wywołaj metodę serwisu.
4.  **Testy:**
    - Test jednostkowy: próba usunięcia istniejącej jednostki (sukces).
    - Test jednostkowy: próba usunięcia jednostki innego trenera (błąd 403).
    - Test jednostkowy: próba usunięcia nieistniejącej jednostki (błąd 404).
