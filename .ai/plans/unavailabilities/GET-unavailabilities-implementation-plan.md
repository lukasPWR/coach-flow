# API Endpoint Implementation Plan: GET /unavailabilities

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerom pobranie listy ich zdefiniowanych okresów niedostępności (np. urlopy, przerwy). Jest kluczowy dla zarządzania własnym harmonogramem. Endpoint zwraca dane wyłącznie dla zalogowanego trenera i pozwala na filtrowanie wyników w określonym przedziale czasu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/unavailabilities`
- **Parametry Zapytania (Query Parameters)**:
  - `from` (opcjonalny, `ISO8601 Date`): Data początkowa zakresu filtrowania.
  - `to` (opcjonalny, `ISO8601 Date`): Data końcowa zakresu filtrowania.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `GetUnavailabilitiesQueryDto`: Służy do walidacji opcjonalnych filtrów dat.
    ```typescript
    import { IsDateString, IsOptional } from 'class-validator';

    export class GetUnavailabilitiesQueryDto {
      @IsOptional()
      @IsDateString()
      readonly from?: string;

      @IsOptional()
      @IsDateString()
      readonly to?: string;
    }
    ```
  - `UnavailabilityResponseDto`: Służy do zwracania danych o niedostępności.
    ```typescript
    export class UnavailabilityResponseDto {
      id: string;
      startTime: Date;
      endTime: Date;
      createdAt: Date;
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca tablicę obiektów niedostępności.
  ```json
  [
    {
      "id": "c1d2e3f4-...",
      "startTime": "2024-01-10T09:00:00.000Z",
      "endTime": "2024-01-10T11:00:00.000Z",
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  ]
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Użytkownik (Trener) wysyła żądanie `GET` na `/unavailabilities`, opcjonalnie z parametrami `from` i `to`.
2.  `UnavailabilitiesController` odbiera żądanie.
3.  Uruchamiane są guardy: `JwtAuthGuard` (weryfikacja tokenu) i `RolesGuard` (rola `TRAINER`).
4.  `ValidationPipe` waliduje parametry query przy użyciu `GetUnavailabilitiesQueryDto`.
5.  Kontroler pobiera `userId` z obiektu `req.user` (zdekodowany z JWT).
6.  Kontroler wywołuje metodę `findAll(userId, queryDto)` w `UnavailabilitiesService`.
7.  `UnavailabilitiesService`:
    - Tworzy zapytanie do bazy danych (`QueryBuilder` lub `FindOptions`).
    - **Kluczowy krok**: Dodaje warunek `where: { trainerId: userId }`, aby zapewnić, że trener widzi tylko swoje dane.
    - Jeśli podano `from` i `to`, dodaje warunki logiczne sprawdzające, czy niedostępność nakłada się na dany okres (lub zawiera się w nim).
      - Logika: `unavailability.startTime <= query.to` AND `unavailability.endTime >= query.from`.
    - Pobiera wyniki z bazy danych.
    - Mapuje encje na `UnavailabilityResponseDto`.
8.  Kontroler zwraca listę DTO z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Izolacja Danych (Row-Level Security w Aplikacji)**: Endpoint musi bezwzględnie używać ID użytkownika wyciągniętego z tokena JWT (`req.user.id`) jako filtra `trainerId` w zapytaniu do bazy danych. Nie wolno polegać na ID przesyłanym przez klienta w inny sposób.
- **Autoryzacja**: Wymagana rola `TRAINER`. Klienci i administratorzy (chyba że zaimplementujemy dla nich osobny endpoint administracyjny) nie powinni mieć dostępu do tego endpointu w tym kontekście.

## 7. Obsługa błędów

- **`400 Bad Request`**: Nieprawidłowy format daty w parametrach `from` lub `to`.
- **`401 Unauthorized`**: Brak lub nieważny token JWT.
- **`403 Forbidden`**: Użytkownik nie posiada roli `TRAINER`.
- **`500 Internal Server Error`**: Błąd bazy danych.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie**: Tabela `unavailabilities` posiada indeks złożony `idx_unavailabilities_trainer_id_start_time` (zdefiniowany w planie DB). Zapytanie filtrujące po `trainerId` i sortujące/filtrujące po `startTime` będzie dzięki temu bardzo wydajne.
- **Zakres Dat**: Zaleca się, aby frontend zawsze wysyłał parametry `from` i `to` (np. dla widoku miesiąca), aby nie pobierać całej historii niedostępności trenera, co z czasem mogłoby obciążyć serwer.

## 9. Etapy wdrożenia

1.  **DTO**:
    - Utworzyć plik `src/unavailabilities/dto/get-unavailabilities-query.dto.ts`.
    - Utworzyć plik `src/unavailabilities/dto/unavailability-response.dto.ts`.
2.  **Serwis (`UnavailabilitiesService`)**:
    - Zaimplementować metodę `async findAll(trainerId: string, query: GetUnavailabilitiesQueryDto): Promise<UnavailabilityResponseDto[]>`.
    - Zaimplementować logikę budowania zapytania z filtrowaniem dat (używając operatorów TypeORM `LessThanOrEqual`, `MoreThanOrEqual` lub `Between`).
3.  **Kontroler (`UnavailabilitiesController`)**:
    - Dodać metodę `findAll` dla `GET /unavailabilities`.
    - Zabezpieczyć guardami: `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles('TRAINER')`.
    - Użyć `@User()` dekoratora (custom decorator) do pobrania ID trenera.
    - Użyć `@Query()` do pobrania parametrów dat.
4.  **Testy**:
    - Unit testy serwisu sprawdzające poprawność filtrowania dat i izolację `trainerId`.
    - E2E testy sprawdzające, czy trener widzi swoje dane, a nie widzi danych innego trenera.

