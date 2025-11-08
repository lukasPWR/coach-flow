# API Endpoint Implementation Plan: DELETE /services/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerowi (użytkownikowi z rolą `TRAINER`) miękkie usunięcie jednej ze swoich własnych usług. Operacja jest idempotentna i zabezpieczona – tylko właściciel usługi może ją usunąć. Usunięcie polega na ustawieniu znacznika czasu w polu `deletedAt`, co pozwala na zachowanie danych w systemie do celów archiwalnych.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `DELETE`
-   **Struktura URL**: `/services/:id`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (w ścieżce URL): Unikalny identyfikator (UUID) usługi do usunięcia.
    -   **Opcjonalne**: Brak.
-   **Request Body**: Brak.
-   **Nagłówki**:
    -   `Authorization`: `Bearer <JWT_TOKEN>` (wymagany do uwierzytelnienia).

## 3. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu**:
    -   **Kod stanu**: `204 No Content`
    -   **Ciało odpowiedzi**: Brak.
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Gdy `id` w URL nie jest prawidłowym UUID.
    -   `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony (brak lub nieprawidłowy token JWT).
    -   `403 Forbidden`: Gdy uwierzytelniony użytkownik nie ma roli `TRAINER` lub nie jest właścicielem usługi.
    -   `404 Not Found`: Gdy usługa o podanym `id` nie istnieje.
    -   `500 Internal Server Error`: W przypadku nieoczekiwanych błędów po stronie serwera.

## 4. Przepływ danych

1.  Żądanie `DELETE` trafia do `ServicesController` na endpoint `/services/:id`.
2.  Globalne guardy (`JwtAuthGuard`, `RolesGuard`) weryfikują token JWT i sprawdzają, czy użytkownik ma rolę `TRAINER`.
3.  `ParseUUIDPipe` waliduje format parametru `:id`.
4.  Kontroler wywołuje metodę `remove(id, user)` w `ServicesService`, przekazując ID usługi oraz dane zalogowanego użytkownika (pobrane z tokena).
5.  `ServicesService` wyszukuje usługę w bazie danych za pomocą `serviceRepository`, sprawdzając, czy `id` istnieje i `deletedAt` jest `null`.
6.  Jeśli usługa nie zostanie znaleziona, serwis rzuca `NotFoundException`.
7.  Serwis porównuje `service.trainerId` z `user.id`. Jeśli się nie zgadzają, rzuca `ForbiddenException`.
8.  Jeśli walidacja przebiegnie pomyślnie, serwis wykonuje operację `update` na repozytorium, ustawiając pole `deletedAt` na aktualny czas.
9.  Serwis nie zwraca żadnych danych (metoda `void`).
10. Kontroler, otrzymując pomyślne zakończenie operacji z serwisu, zwraca odpowiedź HTTP ze statusem `204 No Content`.

## 5. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`, aby zapewnić, że tylko zalogowani użytkownicy mogą go wywołać.
-   **Autoryzacja**:
    -   **Na poziomie roli**: `RolesGuard` musi być użyty do ograniczenia dostępu tylko dla użytkowników z rolą `TRAINER`.
    -   **Na poziomie zasobu**: Logika w `ServicesService` musi bezwzględnie weryfikować, czy ID trenera powiązanego z usługą (`trainerId`) jest identyczne z ID zalogowanego użytkownika. Zapobiega to usunięciu usługi przez innego trenera.
-   **Walidacja danych wejściowych**: `ParseUUIDPipe` musi być użyty w kontrolerze, aby zapobiec atakom i błędom wynikającym z nieprawidłowego formatu ID.

## 6. Obsługa błędów

Błędy będą obsługiwane za pomocą standardowych wyjątków NestJS, które zostaną przechwycone przez globalny filtr wyjątków:

-   `BadRequestException` (`400`): Rzucany przez `ParseUUIDPipe` przy nieprawidłowym formacie UUID.
-   `UnauthorizedException` (`401`): Rzucany przez `JwtAuthGuard`, gdy token jest nieprawidłowy lub go brakuje.
-   `ForbiddenException` (`403`): Rzucany przez `RolesGuard` lub przez `ServicesService`, gdy użytkownik nie jest właścicielem zasobu.
-   `NotFoundException` (`404`): Rzucany przez `ServicesService`, gdy usługa o podanym ID nie istnieje.
-   `InternalServerErrorException` (`500`): W przypadku awarii bazy danych lub innego nieoczekiwanego błędu. Wszystkie nieobsłużone błędy powinny być logowane z pełnym stosem wywołań.

## 7. Rozważania dotyczące wydajności

Operacja usunięcia jest prosta i nie powinna stanowić wąskiego gardła wydajnościowego. Kluczowe jest zapewnienie, że kolumna `id` w tabeli `services` jest głównym kluczem, a `trainerId` jest zindeksowane, co przyspieszy wyszukiwanie i weryfikację. Zapytanie do bazy danych będzie składać się z jednego `SELECT` (w celu znalezienia i weryfikacji) i jednego `UPDATE` (w celu miękkiego usunięcia), co jest bardzo wydajne.

## 8. Etapy wdrożenia

1.  **Aktualizacja `services.controller.ts`**:
    -   Dodaj nową metodę obsługującą `DELETE` na ścieżce `:id`.
    -   Użyj dekoratorów `@Delete(':id')`, `@HttpCode(204)`, `@ApiBearerAuth()`.
    -   Zabezpiecz metodę za pomocą `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(Role.TRAINER)`.
    -   Dodaj odpowiednią dokumentację Swagger (`@ApiOperation`, `@ApiResponse` itp.).
    -   Wstrzyknij `Request` i pobierz z niego obiekt `user`.
    -   Wywołaj nową metodę z `ServicesService`, przekazując ID usługi i ID użytkownika.

2.  **Aktualizacja `services.service.ts`**:
    -   Stwórz nową publiczną metodę asynchroniczną `remove(id: string, userId: string): Promise<void>`.
    -   W metodzie zaimplementuj logikę:
        -   Znajdź usługę po `id`, gdzie `deletedAt` jest `null`. Użyj `findOneOrFail` lub znajdź i rzuć `NotFoundException` ręcznie.
        -   Sprawdź, czy `service.trainerId === userId`. Jeśli nie, rzuć `ForbiddenException`.
        -   Użyj `serviceRepository.update(id, { deletedAt: new Date() })` do wykonania miękkiego usunięcia.

3.  **Aktualizacja `service.entity.ts`**:
    -   Upewnij się, że encja `Service` posiada pole `deletedAt` z typem `Date` i adnotacją `@DeleteDateColumn()`.

4.  **Testy E2E**:
    -   Stwórz nowy plik testowy lub zaktualizuj istniejący (`services.e2e-spec.ts`).
    -   Dodaj scenariusze testowe dla endpointu `DELETE /services/:id`:
        -   Pomyślne usunięcie usługi przez jej właściciela (oczekiwany status `204`).
        -   Próba usunięcia usługi przez innego trenera (oczekiwany status `403`).
        -   Próba usunięcia nieistniejącej usługi (oczekiwany status `404`).
        -   Próba usunięcia usługi bez uwierzytelnienia (oczekiwany status `401`).
        -   Próba usunięcia z nieprawidłowym UUID (oczekiwany status `400`).
