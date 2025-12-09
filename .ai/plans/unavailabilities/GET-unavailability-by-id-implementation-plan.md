# API Endpoint Implementation Plan: GET /unavailabilities/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerowi pobranie szczegółowych informacji o konkretnym okresie niedostępności na podstawie jego identyfikatora. Służy zazwyczaj do wyświetlenia szczegółów przed edycją (choć edycja nie jest tu zdefiniowana, często jest to pierwszy krok) lub usunięciem. Endpoint gwarantuje, że trener ma dostęp tylko do własnych danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/unavailabilities/:id`
- **Parametry Ścieżki (Path Parameters)**:
  - `id` (wymagany, `UUID`): Unikalny identyfikator niedostępności.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `UnavailabilityResponseDto`: Standardowy obiekt odpowiedzi dla tego modułu, zawierający `id`, `startTime`, `endTime`, `createdAt`.

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca obiekt niedostępności.
  ```json
  {
    "id": "c1d2e3f4-...",
    "startTime": "2024-01-10T09:00:00.000Z",
    "endTime": "2024-01-10T11:00:00.000Z",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Trener wysyła żądanie `GET` na `/unavailabilities/some-uuid`.
2.  `UnavailabilitiesController` odbiera żądanie.
3.  Guardy `JwtAuthGuard` i `RolesGuard` (`TRAINER`) autoryzują użytkownika.
4.  `ParseUUIDPipe` waliduje parametr `:id`.
5.  Kontroler pobiera `trainerId` z tokena JWT (`req.user.id`).
6.  Kontroler wywołuje `service.findOne(id, trainerId)`.
7.  `UnavailabilitiesService`:
    - Wykonuje zapytanie do bazy danych: `SELECT * FROM unavailabilities WHERE id = :id AND trainerId = :trainerId`.
    - Jeśli wynik jest pusty (null), rzuca wyjątek `NotFoundException`.
    - Jeśli wynik istnieje, mapuje encję na `UnavailabilityResponseDto`.
8.  Kontroler zwraca obiekt z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Ochrona przed IDOR**: Podobnie jak w przypadku usuwania, kluczowe jest dołączenie `trainerId` do warunków zapytania bazy danych. Zapobiega to sytuacji, w której jeden trener mógłby podejrzeć szczegóły niedostępności innego trenera (np. komentarz, jeśli taki by istniał), znając tylko UUID.

## 7. Obsługa błędów

- **`400 Bad Request`**: Nieprawidłowy format UUID.
- **`401 Unauthorized`**: Brak/błędny token.
- **`403 Forbidden`**: Brak roli `TRAINER`.
- **`404 Not Found`**: Zasób nie istnieje lub należy do innego użytkownika.
- **`500 Internal Server Error`**: Błąd serwera.

## 8. Rozważania dotyczące wydajności

- Pobieranie pojedynczego rekordu po kluczu głównym jest operacją o złożoności O(1) dla bazy danych i jest wysoce wydajne.

## 9. Etapy wdrożenia

1.  **Serwis (`UnavailabilitiesService`)**:
    - Zaimplementować metodę `async findOne(id: string, trainerId: string): Promise<UnavailabilityResponseDto>`.
    - Użyć `findOne({ where: { id, trainerId } })`.
    - Obsłużyć brak wyniku (`NotFoundException`).
2.  **Kontroler (`UnavailabilitiesController`)**:
    - Dodać metodę `findOne` (`GET /unavailabilities/:id`).
    - Dekoratory: `@Get(':id')`, `@UseGuards(...)`.
    - Parametry: `@Param('id', ParseUUIDPipe)`, `@User()`.
3.  **Testy**:
    - Unit: Test sukcesu (własny wpis) i błędu (obcy/nieistniejący wpis).
    - E2E: Weryfikacja kodów HTTP i struktury JSON.

