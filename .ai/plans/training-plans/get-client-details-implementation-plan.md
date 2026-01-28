Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API.

<analysis>
1.  **Specyfikacja API**:
    *   **Endpoint**: `GET /trainer/clients/:id`
    *   **Cel**: Pobranie danych pojedynczego klienta (id, imię, email) dla zalogowanego trenera.
    *   **Kluczowy warunek**: Weryfikacja relacji trener-klient (istnienie rezerwacji).
    *   **Moduł implementacji**: Endpoint logicznie przynależy do funkcjonalności trenera (`trainer-profiles`), mimo że jest wymagany przez moduł planów treningowych. Zostanie dodany do istniejącego `TrainerController` w module `trainer-profiles`, obok istniejącego endpointu `GET /trainer/clients`.

2.  **Parametry**:
    *   Wymagane: `id` (UUID) w ścieżce URL.
    *   Kontekst: `user.userId` z tokenu JWT (identyfikator trenera).

3.  **DTO i Modele**:
    *   Można i należy ponownie wykorzystać istniejący `TrainerClientResponseDto` (zdefiniowany w `backend/src/trainer-profiles/dto/trainer-client.response.dto.ts`), ponieważ struktura odpowiedzi jest identyczna jak dla listy klientów.

4.  **Logika w Serwisie**:
    *   Rozszerzenie `TrainerProfilesService` o metodę `getClientById(trainerId: string, clientId: string)`.
    *   Rozszerzenie `BookingsRepository` o metodę `findClientOfTrainer(trainerId: string, clientId: string)`, która wykona zapytanie z `INNER JOIN` do tabeli `users` i sprawdzi istnienie rezerwacji.

5.  **Walidacja i Bezpieczeństwo**:
    *   `JwtAuthGuard` i `RolesGuard` (Rola: TRAINER) - już obecne w kontrolerze.
    *   Walidacja `ParseUUIDPipe` dla parametru `:id`.
    *   Uprawnienia: Sprawdzenie, czy `bookings` zawiera rekord łączący `trainerId` i `clientId`.

6.  **Obsługa Błędów**:
    *   **404 Not Found**: Jeśli użytkownik o podanym ID nie istnieje.
    *   **403 Forbidden**: Jeśli użytkownik istnieje, ale nie jest klientem tego trenera (brak historii rezerwacji).

7.  **Zagrożenia i Wydajność**:
    *   Potencjalny IDOR (Insecure Direct Object Reference) - mitygowany przez sprawdzenie relacji w bazie danych.
    *   Wydajność: Zapytanie SQL powinno używać indeksów na `bookings(trainerId)` i `bookings(clientId)`.

8.  **Kody Stanu**:
    *   200 OK (Sukces)
    *   400 Bad Request (Niepoprawne UUID)
    *   401 Unauthorized (Brak tokenu)
    *   403 Forbidden (Brak dostępu)
    *   404 Not Found (Nie znaleziono)
</analysis>

# API Endpoint Implementation Plan: Get Client Details

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia trenerowi pobranie podstawowych danych (ID, imię, email) konkretnego klienta. Jest to niezbędne przy tworzeniu planów treningowych, aby zweryfikować tożsamość wybranego klienta. Endpoint implementuje rygorystyczną kontrolę dostępu, zapewniając, że trenerzy mają dostęp wyłącznie do danych osób, z którymi posiadają historię rezerwacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/trainer/clients/:id`
- **Lokalizacja**: `backend/src/trainer-profiles/trainer.controller.ts`
- **Parametry**:
    - **Wymagane**:
        - `id` (Path Parameter): UUID klienta, którego dane mają zostać pobrane.
- **Nagłówki**:
    - `Authorization`: Bearer <JWT Token> (Wymagany token trenera)
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane istniejące DTO, aby zachować spójność z endpointem listującym klientów (`GET /trainer/clients`).

- **Response DTO**: `TrainerClientResponseDto` (`backend/src/trainer-profiles/dto/trainer-client.response.dto.ts`)
    - `id`: string (UUID)
    - `name`: string
    - `email`: string

## 4. Szczegóły odpowiedzi

**Status 200 OK**
Zwraca obiekt JSON z danymi klienta:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Jan Kowalski",
  "email": "jan.kowalski@example.com"
}
```

## 5. Przepływ danych

1.  **Kontroler (`TrainerController`)**:
    - Odbiera żądanie `GET /trainer/clients/:id`.
    - Waliduje token JWT i rolę użytkownika (Guardy).
    - Waliduje poprawność formatu UUID parametru `id` (`ParseUUIDPipe`).
    - Wywołuje metodę serwisu: `trainerProfilesService.getClientById(trainerId, clientId)`.

2.  **Serwis (`TrainerProfilesService`)**:
    - Przekazuje zapytanie do repozytorium rezerwacji.
    - Obsługuje logikę wyjątków biznesowych (rzucenie `NotFoundException` lub `ForbiddenException` w zależności od wyniku z repozytorium).

3.  **Repozytorium (`BookingsRepository`)**:
    - Wykonuje zapytanie do bazy danych łączące tabele `bookings` i `users`.
    - Sprawdza, czy istnieje jakakolwiek rezerwacja (o statusie innym niż anulowany lub wliczając anulowane, zgodnie z założeniem "historia rezerwacji") pomiędzy `trainerId` a `clientId`.
    - Zwraca dane klienta, jeśli relacja istnieje.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany ważny token JWT.
- **Autoryzacja (RBAC)**: Dostęp tylko dla użytkowników z rolą `TRAINER`.
- **Walidacja Relacji (Data Access Control)**: Kluczowy element bezpieczeństwa. System **musi** zweryfikować, czy dany trener obsłużył kiedykolwiek danego klienta. Zapobiega to enumeracji użytkowników systemu i dostępowi do danych osobowych osób postronnych.
- **Sanityzacja Danych**: Endpoint zwraca tylko niezbędne dane (imię, email), ukrywając wrażliwe informacje (hasło, data urodzenia itp.).

## 7. Obsługa błędów

| Scenariusz | Kod HTTP | Wyjątek NestJS | Komunikat (przykład) |
| :--- | :--- | :--- | :--- |
| Niepoprawne UUID w URL | 400 | `BadRequestException` | "Validation failed (uuid is expected)" |
| Brak tokenu / Niepoprawny token | 401 | `UnauthorizedException` | "Unauthorized" |
| Użytkownik nie ma roli TRAINER | 403 | `ForbiddenException` | "Access denied. Required roles: TRAINER" |
| Brak relacji Trener-Klient | 403 | `ForbiddenException` | "Client is not associated with this trainer" |
| Klient nie istnieje | 404 | `NotFoundException` | "Client not found" |
| Błąd serwera/bazy danych | 500 | `InternalServerErrorException` | "Internal server error" |

*Uwaga: Zgodnie ze specyfikacją, system może zwracać 403 jeśli użytkownik istnieje ale nie jest klientem, oraz 404 jeśli użytkownik w ogóle nie istnieje. W implementacji zaleca się najpierw sprawdzenie istnienia użytkownika (User Repository), a potem relacji, lub wykonanie jednego zapytania i zwrócenie generycznego 404 lub 403 w zależności od polityki prywatności (zwracanie 404 dla braku relacji jest bezpieczniejsze pod kątem enumeracji, ale specyfikacja sugeruje 403).*

## 8. Rozważania dotyczące wydajności

- Wykorzystanie istniejących indeksów na kolumnach `trainerId` i `clientId` w tabeli `bookings`.
- Zapytanie SQL powinno używać `LIMIT 1` (lub `getRawOne`), ponieważ wystarczy znaleźć **jedno** powiązanie, aby autoryzować dostęp. Nie ma potrzeby pobierania całej historii rezerwacji.

## 9. Etapy wdrożenia

1.  **Aktualizacja Repozytorium (`BookingsRepository`)**:
    - Dodanie metody `findClientOfTrainer(trainerId: string, clientId: string): Promise<TrainerClientData | null>`.
    - Implementacja zapytania `QueryBuilder` sprawdzającego istnienie rezerwacji i zwracającego dane klienta.

2.  **Aktualizacja Serwisu (`TrainerProfilesService`)**:
    - Dodanie metody `getClientById(trainerId: string, clientId: string): Promise<TrainerClientResponseDto>`.
    - Dodanie logiki sprawdzającej najpierw istnienie użytkownika (opcjonalnie, dla precyzyjnego 404), a następnie wywołanie metody repozytorium.
    - Rzucenie odpowiednich wyjątków (`NotFoundException`, `ForbiddenException`).

3.  **Aktualizacja Kontrolera (`TrainerController`)**:
    - Dodanie metody `@Get("clients/:id")` obsługującej endpoint.
    - Konfiguracja dekoratorów Swagger (`@ApiOperation`, `@ApiResponse`, `@ApiParam`).
    - Podpięcie walidacji `ParseUUIDPipe`.

4.  **Weryfikacja Manualna**:
    - Testowanie dostępu jako Trener dla własnego klienta (200).
    - Testowanie dostępu jako Trener dla cudzego klienta (403).
    - Testowanie dostępu dla nieistniejącego ID (404).
