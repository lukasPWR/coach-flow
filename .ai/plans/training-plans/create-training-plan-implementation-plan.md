# API Endpoint Implementation Plan: POST /training-plans

## 1. Przegląd punktu końcowego

Endpoint `POST /training-plans` umożliwia trenerom tworzenie nowych planów treningowych dla swoich klientów. Tworzony jest jedynie nagłówek planu (tabela `training_plans`); struktura (jednostki, ćwiczenia) jest dodawana w kolejnych krokach.

**Kluczowe ograniczenia:**

- Tylko użytkownik z rolą `TRAINER` może tworzyć plany.
- Klient (`clientId`) wskazany w żądaniu musi istnieć i być podopiecznym danego trenera (relacja `trainer-client` w module users/invitations - choć w MVP może wystarczyć sprawdzenie czy user o `clientId` istnieje i ma rolę `CLIENT`).

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/training-plans`
- **Parametry Query:** Brak.
- **Request Body (JSON):**
  - `name`: `string` (Wymagane, max 255) - Nazwa planu.
  - `clientId`: `UUID` (Wymagane) - ID klienta, dla którego tworzony jest plan.
  - `description`: `string` (Opcjonalne, max 2000) - Notatki/opis.
- **Nagłówki:**
  - `Authorization`: `Bearer <token>` (Wymagany token JWT).

## 3. Wykorzystywane typy

Do implementacji niezbędne będą następujące elementy (zdefiniowane w `training-plans-types.md`):

- **DTO:** `CreateTrainingPlanDto`
  - `name`: `@IsString`, `@IsNotEmpty`, `@MaxLength(255)`
  - `clientId`: `@IsUUID`, `@IsNotEmpty`
  - `description`: `@IsOptional`, `@IsString`, `@MaxLength(2000)`
- **DTO Odpowiedzi:** `TrainingPlanResponseDto` (lub pełna encja zmapowana na DTO).

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** `201 Created`
- **Typ zawartości:** `application/json`
- **Struktura:** Obiekt `TrainingPlanResponseDto` (reprezentacja utworzonego zasobu).

Przykład:

```json
{
  "id": "new-uuid-1234",
  "trainerId": "log-in-trainer-id",
  "clientId": "client-uuid-from-body",
  "name": "Strength Block 1",
  "description": "Optional notes",
  "status": "ACTIVE",
  "createdAt": "2026-01-20T12:00:00Z",
  "updatedAt": "2026-01-20T12:00:00Z"
}
```

## 5. Przepływ danych

1.  **Controller (`TrainingPlansController`):**
    - Przechwytuje żądanie `POST`.
    - Sprawdza rolę użytkownika (wymagany `TRAINER`).
    - Wywołuje serwis z obiektem DTO i ID trenera (z tokenu).

2.  **Service (`TrainingPlansService`):**
    - Odbiera dane wejściowe.
    - **Walidacja biznesowa:** Sprawdza, czy klient o podanym `clientId` istnieje (wywołanie serwisu użytkowników lub repozytorium użytkowników). _Opcjonalnie: sprawdza czy klient jest powiązany z trenerem._
    - Tworzy instancję encji `TrainingPlan`.
    - Ustawia `trainerId` na ID zalogowanego użytkownika.
    - Ustawia `status` na `ACTIVE` (domyślnie w bazie, ale warto być jawnym).
    - Wywołuje repozytorium `save`.
    - Mapuje zapisaną encję na `TrainingPlanResponseDto`.

3.  **Repository (`TrainingPlansRepository`):**
    - `save(entity)`: Zapisuje nowy rekord w tabeli `training_plans`.

4.  **Database:**
    - `INSERT INTO training_plans ...`

## 6. Względy bezpieczeństwa

- **Rola:** Endpoint dostępny TYLKO dla trenerów (`@Roles(Role.TRAINER)`).
- **Integralność danych:** Nie można przypisać planu do nieistniejącego klienta (ForeignKey constraint + weryfikacja w serwisie).
- **Walidacja danych:** `ValidationPipe` sprawdza typy i długość pól.
- **Sanityzacja:** `class-transformer` i `class-validator` (whitelist: true) odrzucają nadmiarowe pola z body.

## 7. Obsługa błędów

- **400 Bad Request:** Błędy walidacji DTO (np. brak nazwy, zły format UUID).
- **401 Unauthorized:** Brak tokenu.
- **403 Forbidden:** Użytkownik nie jest trenerem.
- **404 Not Found:** Klient o podanym `clientId` nie istnieje (jeśli sprawdzamy to przed zapisem) LUB błąd `ForeignKeyConstraintViolation` (jeśli polegamy na bazie). Preferowane sprawdzenie w serwisie i rzucenie czytelnego błędu.

## 8. Rozważania dotyczące wydajności

- Operacja `INSERT` jest szybka.
- Sprawdzenie istnienia klienta może wymagać 1 dodatkowego zapytania do bazy (`users` table), co jest pomijalnym kosztem.

## 9. Etapy wdrożenia

1.  **Weryfikacja DTO:**
    - Upewnij się, że `CreateTrainingPlanDto` jest poprawnie zdefiniowane.

2.  **Serwis (Walidacja Klienta):**
    - Jeśli moduł `UsersModule` eksportuje `UsersService`, wstrzyknij go do `TrainingPlansService`.
    - Zaimplementuj metodę `create(createTrainingPlanDto: CreateTrainingPlanDto, trainer: User)`.
    - W metodzie sprawdź istnienie klienta (`usersService.findOne(dto.clientId)`).

3.  **Serwis (Tworzenie):**
    - Utwórz obiekt `TrainingPlan` (`repository.create(...)`).
    - Zapisz (`repository.save(...)`).
    - Zwróć DTO.

4.  **Kontroler:**
    - Dodaj metodę `@Post()`.
    - Zastosuj `@UseGuards(JwtAuthGuard, RolesGuard)`.
    - Zastosuj `@Roles(Role.TRAINER)`.

5.  **Testy:**
    - Test jednostkowy: Trener tworzy plan dla istniejącego klienta -> Sukces.
    - Test jednostkowy: Trener tworzy plan dla nieistniejącego klienta -> Błąd.
    - Test jednostkowy: Klient próbuje utworzyć plan -> Błąd 403.
