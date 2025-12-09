# API Endpoint Implementation Plan: DELETE /unavailabilities/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerom usunięcie wcześniej zdefiniowanego okresu niedostępności. Usunięcie niedostępności sprawia, że dany termin staje się ponownie dostępny do rezerwacji dla klientów (o ile nie koliduje z innymi rezerwacjami/blokadami). Endpoint zapewnia, że trener może zarządzać wyłącznie własnymi wpisami.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/unavailabilities/:id`
- **Parametry Ścieżki (Path Parameters)**:
  - `id` (wymagany, `UUID`): Unikalny identyfikator niedostępności do usunięcia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: Brak (operacja nie wymaga ciała żądania i nie zwraca treści).

## 4. Szczegóły odpowiedzi

- **Sukces (`204 No Content`)**:
  - Odpowiedź bez treści.
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Trener wysyła żądanie `DELETE` na `/unavailabilities/some-uuid`.
2.  `UnavailabilitiesController` odbiera żądanie.
3.  Guardy `JwtAuthGuard` i `RolesGuard` (`TRAINER`) weryfikują uprawnienia.
4.  `ParseUUIDPipe` waliduje poprawność formatu parametru `:id`.
5.  Kontroler pobiera `trainerId` z `req.user.id`.
6.  Kontroler wywołuje metodę `remove(id, trainerId)` w `UnavailabilitiesService`.
7.  `UnavailabilitiesService`:
    - Wykonuje operację usunięcia w bazie danych z warunkiem złożonym: `DELETE FROM unavailabilities WHERE id = :id AND trainerId = :trainerId`.
    - Sprawdza wynik operacji (`affected rows`).
    - Jeśli liczba usuniętych wierszy wynosi 0, oznacza to, że wpis nie istnieje lub należy do innego trenera. W takim przypadku rzuca wyjątek `NotFoundException`.
    - Jeśli usunięto 1 wiersz, operacja kończy się sukcesem.
8.  Kontroler zwraca odpowiedź z kodem `204 No Content`.

## 6. Względy bezpieczeństwa

- **Ochrona przed IDOR (Insecure Direct Object References)**: Jest to krytyczny aspekt tego endpointu. Nie wystarczy sprawdzić, czy rekord o danym ID istnieje. Należy bezwzględnie sprawdzić, czy należy on do aktualnie zalogowanego użytkownika (`trainerId` z tokena). Zastosowanie warunku `AND trainerId = :trainerId` w zapytaniu SQL/ORM realizuje to wymaganie w sposób atomowy i bezpieczny.

## 7. Obsługa błędów

- **`400 Bad Request`**: Parametr `:id` nie jest poprawnym UUID.
- **`401 Unauthorized`**: Brak lub nieważny token JWT.
- **`403 Forbidden`**: Użytkownik nie posiada roli `TRAINER`.
- **`404 Not Found`**: Zasób o podanym ID nie istnieje lub należy do innego trenera (dla bezpieczeństwa nie rozróżniamy tych dwóch sytuacji w komunikacie błędu).
- **`500 Internal Server Error`**: Błąd bazy danych.

## 8. Rozważania dotyczące wydajności

- Operacja usunięcia po kluczu głównym (nawet z dodatkowym warunkiem) jest bardzo szybka i nie stanowi obciążenia dla bazy danych.

## 9. Etapy wdrożenia

1.  **Serwis (`UnavailabilitiesService`)**:
    - Zaimplementować metodę `async remove(id: string, trainerId: string): Promise<void>`.
    - Użyć metody repozytorium `delete({ id, trainerId })` (lub QueryBuildera dla pewności).
    - Zaimplementować sprawdzenie `result.affected` i rzucanie wyjątku `NotFoundException`.
2.  **Kontroler (`UnavailabilitiesController`)**:
    - Dodać metodę `remove` (`DELETE /unavailabilities/:id`).
    - Dekoratory: `@Delete(':id')`, `@HttpCode(204)`, `@UseGuards(...)`.
    - Pobrać ID z URL (`@Param('id', ParseUUIDPipe)`) i ID trenera (`@User()`).
3.  **Testy**:
    - Test jednostkowy: Próba usunięcia istniejącego wpisu innego trenera -> oczekiwany `NotFoundException`.
    - Test jednostkowy: Próba usunięcia własnego wpisu -> sukces.
    - Test E2E: Weryfikacja kodów statusu i faktycznego usunięcia z bazy.

