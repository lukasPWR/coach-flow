# API Endpoint Implementation Plan: DELETE /booking-bans/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia administratorom trwałe usunięcie blokady rezerwacji z systemu na podstawie jej unikalnego identyfikatora.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/booking-bans/:id`
- **Parametry Ścieżki (Path Parameters)**:
  - `id` (wymagany, `UUID`): Identyfikator blokady rezerwacji do usunięcia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: Dla tego punktu końcowego nie są wymagane żadne obiekty DTO.

## 4. Szczegóły odpowiedzi

- **Sukces (`204 No Content`)**:
  - Odpowiedź nie zawiera żadnej treści (puste ciało odpowiedzi).
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Administrator wysyła żądanie `DELETE` na adres `/booking-bans/some-uuid`.
2.  `BookingBansController` odbiera żądanie.
3.  Uruchamiane są guardy `JwtAuthGuard` oraz `RolesGuard('ADMIN')`.
4.  `ParseUUIDPipe` waliduje parametr `:id`.
5.  Kontroler wywołuje metodę `remove(id)` w `BookingBansService`.
6.  `BookingBansService`:
    - Wywołuje `this.repository.delete(id)`.
    - Sprawdza wynik operacji. Jeśli liczba usuniętych wierszy (`affected`) wynosi 0, rzuca `NotFoundException`.
    - Jeśli operacja się powiodła, metoda kończy działanie.
7.  Kontroler, nie otrzymując błędu, zwraca odpowiedź z kodem statusu `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i Autoryzacja**: Dostęp do endpointu jest ściśle kontrolowany przez `JwtAuthGuard` i `RolesGuard`, co zapobiega nieautoryzowanemu usuwaniu danych.
- **Walidacja ID**: Użycie `ParseUUIDPipe` chroni przed próbami wykonania operacji z nieprawidłowym formatem identyfikatora.

## 7. Obsługa błędów

- **`400 Bad Request`**: Parametr `:id` w ścieżce URL nie jest prawidłowym formatem UUID.
- **`401 Unauthorized`**: Brak lub nieważny token JWT.
- **`403 Forbidden`**: Uwierzytelniony użytkownik nie ma uprawnień administratora.
- **`404 Not Found`**: W bazie danych nie istnieje blokada o podanym `id`.
- **`500 Internal Server Error`**: Wystąpił nieoczekiwany błąd po stronie serwera.

## 8. Rozważania dotyczące wydajności

- Operacja usunięcia rekordu na podstawie jego klucza głównego jest jedną z najszybszych i najbardziej zoptymalizowanych operacji, jakie można wykonać na bazie danych.
- Nie przewiduje się żadnych problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **Serwis (`BookingBansService`)**:
    - Zaimplementować metodę `async remove(id: string): Promise<void>`.
    - Dodać logikę usuwania rekordu za pomocą `this.repository.delete(id)`.
    - Dodać logikę sprawdzania wyniku i rzucania `NotFoundException`, jeśli `result.affected === 0`.
2.  **Kontroler (`BookingBansController`)**:
    - Dodać metodę `remove` dla `DELETE /booking-bans/:id`.
    - Użyć dekoratorów `@Delete(':id')` oraz `@HttpCode(HttpStatus.NO_CONTENT)`.
    - Zabezpieczyć metodę guardami i zwalidować parametr `:id` za pomocą `ParseUUIDPipe`.
    - Dodać adnotacje Swagger (`@ApiNoContentResponse`, `@ApiNotFoundResponse`, etc.).
3.  **Testy**:
    - Napisać test jednostkowy dla `BookingBansService.remove`, weryfikujący scenariusz pomyślnego usunięcia oraz scenariusz "not found".
    - Napisać test e2e dla endpointu, sprawdzający poprawną odpowiedź `204`, autoryzację oraz obsługę błędów `400`, `403` i `404`.
