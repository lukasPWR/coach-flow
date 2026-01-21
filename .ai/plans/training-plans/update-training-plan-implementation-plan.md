# API Endpoint Implementation Plan: PATCH /training-plans/:id

## 1. Przegląd punktu końcowego

Endpoint `PATCH /training-plans/:id` umożliwia trenerom edycję nagłówka planu treningowego. Służy do zmiany nazwy, opisu oraz statusu planu (np. archiwizacja). Edycja struktury (jednostek i ćwiczeń) odbywa się przez dedykowane endpointy.

**Dostęp:** Tylko trener będący właścicielem planu może go edytować. Klienci mają dostęp tylko do odczytu nagłówka.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/training-plans/:id`
- **Parametry Ścieżki:**
  - `id`: `UUID` (Wymagane) - ID planu do edycji.
- **Parametry Query:** Brak.
- **Request Body (JSON):**
  - `name`: `string` (Opcjonalne, max 255)
  - `description`: `string` (Opcjonalne, max 2000)
  - `status`: `PlanStatus` (`ACTIVE` | `ARCHIVED`) (Opcjonalne)
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

Do implementacji niezbędne będą następujące elementy (zdefiniowane w `training-plans-types.md`):

- **DTO:** `UpdateTrainingPlanDto`
  - `name`: `@IsOptional`, `@IsString`, `@MaxLength(255)`
  - `description`: `@IsOptional`, `@IsString`, `@MaxLength(2000)`
  - `status`: `@IsOptional`, `@IsEnum(PlanStatus)`
- **Enum:** `PlanStatus` (ACTIVE, ARCHIVED).
- **DTO Odpowiedzi:** `TrainingPlanResponseDto` (zaktualizowany obiekt).

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `200 OK`
- **Typ zawartości:** `application/json`
- **Struktura:** Obiekt `TrainingPlanResponseDto` (po aktualizacji).

Przykład:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "trainerId": "user-uuid-1",
  "clientId": "user-uuid-2",
  "name": "Nowa nazwa planu",
  "description": "Zaktualizowany opis",
  "status": "ARCHIVED",
  "createdAt": "2026-01-20T10:00:00Z",
  "updatedAt": "2026-01-21T15:30:00Z"
}
```

## 5. Przepływ danych

1.  **Controller (`TrainingPlansController`):**
    - Przechwytuje żądanie `PATCH /:id`.
    - Sprawdza rolę (wymagany `TRAINER`).
    - Przekazuje `id`, `dto` oraz `user` do serwisu.

2.  **Service (`TrainingPlansService`):**
    - Pobiera plan z bazy danych (`findOne`).
    - **Weryfikacja istnienia:** Jeśli brak -> `NotFoundException`.
    - **Weryfikacja uprawnień:** Sprawdza, czy `plan.trainerId === user.id`. Jeśli nie -> `ForbiddenException` (lub `NotFoundException`).
    - Aplikuje zmiany z DTO na encję.
    - Zapisuje zmiany (`repository.save`).
    - Zwraca zaktualizowany obiekt zmapowany na DTO.

3.  **Repository (`TrainingPlansRepository`):**
    - `findOne(id)`: Pobranie stanu początkowego.
    - `save(entity)`: Zapisanie zmian (UPDATE).

4.  **Database:**
    - `UPDATE training_plans SET ... WHERE id = ...`

## 6. Względy bezpieczeństwa

- **Weryfikacja właściciela (Ownership Check):** To krytyczny punkt. Trener A nie może edytować planu Trenera B.
- **Role:** Endpoint zablokowany dla użytkowników z rolą `CLIENT`.
- **Walidacja danych:** `ValidationPipe` zapewnia poprawność typów i enumów (np. nie można ustawić statusu "DELETED" jeśli nie ma go w enumie).

## 7. Obsługa błędów

- **400 Bad Request:** Błędy walidacji pola (np. nazwa zbyt długa, nieprawidłowy status).
- **401 Unauthorized:** Brak tokenu JWT.
- **403 Forbidden:** Użytkownik nie jest trenerem LUB próbuje edytować cudzy plan.
- **404 Not Found:** Plan o podanym ID nie istnieje.

## 8. Rozważania dotyczące wydajności

- Standardowa operacja aktualizacji pojedynczego rekordu po kluczu głównym (bardzo szybka).
- Można użyć `repository.update()` jeśli nie potrzebujemy zwracać pełnego obiektu, ale standard REST sugeruje zwrócenie zasobu. Metoda `preload` + `save` jest wygodna w NestJS/TypeORM.

## 9. Etapy wdrożenia

1.  **DTO:**
    - Upewnij się, że `UpdateTrainingPlanDto` istnieje i `extends PartialType(CreateTrainingPlanDto)` lub ma zdefiniowane pola opcjonalne.

2.  **Serwis:**
    - Zaimplementuj metodę `update(id: string, updateDto: UpdateTrainingPlanDto, user: User)`.
    - Dodaj logikę sprawdzania `trainerId`.

3.  **Kontroler:**
    - Dodaj metodę `@Patch(':id')`.
    - Użyj `@Roles(Role.TRAINER)`.
    - Podłącz rury walidacyjne: `@Body() dto: UpdateTrainingPlanDto`.

4.  **Testy:**
    - Test: Właściciel zmienia nazwę -> 200 OK.
    - Test: Trener próbuje zmienić cudzy plan -> 403 Forbidden / 404 Not Found.
    - Test: Klient próbuje użyć endpointu -> 403 Forbidden.
