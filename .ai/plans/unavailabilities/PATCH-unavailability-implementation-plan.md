# API Endpoint Implementation Plan: PATCH /unavailabilities/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerom modyfikację istniejącego okresu niedostępności (np. zmianę godzin lub dat). Podobnie jak przy tworzeniu, system musi zapewnić spójność danych, weryfikując, czy zmodyfikowany termin nie koliduje z innymi rezerwacjami lub niedostępnościami.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/unavailabilities/:id`
- **Parametry Ścieżki**:
  - `id` (wymagany, `UUID`): Identyfikator niedostępności.
- **Request Body** (opcjonalne pola):
  ```json
  {
    "startTime": "2023-12-24T10:00:00.000Z",
    "endTime": "2023-12-26T18:00:00.000Z"
  }
  ```

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `UpdateUnavailabilityDto`: Klasa oparta na `CreateUnavailabilityDto` (PartialType), gdzie wszystkie pola są opcjonalne.
    ```typescript
    import { PartialType } from '@nestjs/mapped-types'; // lub @nestjs/swagger
    import { CreateUnavailabilityDto } from './create-unavailability.dto';

    export class UpdateUnavailabilityDto extends PartialType(CreateUnavailabilityDto) {}
    ```
  - `UnavailabilityResponseDto`: Zwracany obiekt.

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca zaktualizowany obiekt niedostępności.
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Trener wysyła żądanie `PATCH`.
2.  Kontroler weryfikuje uprawnienia (`JwtAuthGuard`, `RolesGuard`).
3.  `ValidationPipe` waliduje DTO.
4.  Kontroler wywołuje `service.update(id, trainerId, updateDto)`.
5.  `UnavailabilitiesService`:
    - **Pobranie**: Wyszukuje rekord po `id` i `trainerId`. Jeśli nie istnieje -> `NotFoundException`.
    - **Scalanie**: Ustala nowe wartości `startTime` i `endTime`, biorąc pod uwagę te z DTO lub pozostawiając stare, jeśli ich nie przesłano.
    - **Walidacja logiczna**: Sprawdza, czy `newStartTime < newEndTime`.
    - **Weryfikacja konfliktów**:
      - Sprawdza konflikty w `unavailabilities`, **wykluczając** aktualnie edytowany rekord (`id != currentId`), aby uniknąć fałszywego konfliktu z samym sobą.
      - Sprawdza konflikty w `bookings` (czy w nowym terminie są zaakceptowane rezerwacje).
      - Jeśli konflikt -> `ConflictException`.
    - **Zapis**: Aktualizuje encję w bazie.
    - **Zwrot**: Zwraca zaktualizowany obiekt.
6.  Kontroler zwraca odpowiedź `200 OK`.

## 6. Względy bezpieczeństwa

- **Ochrona przed IDOR**: Wymóg zgodności `trainerId` przy pobieraniu rekordu do edycji.
- **Spójność kalendarza**: Edycja terminu jest traktowana tak samo rygorystycznie jak tworzenie nowego - nie można przesunąć niedostępności na termin, który jest już zajęty przez klienta.

## 7. Obsługa błędów

- **`400 Bad Request`**: Błędny format danych, `start >= end`.
- **`401 Unauthorized`**: Brak tokena.
- **`403 Forbidden`**: Brak roli `TRAINER`.
- **`404 Not Found`**: Rekord nie istnieje lub brak dostępu.
- **`409 Conflict`**: Termin zajęty.

## 8. Rozważania dotyczące wydajności

- Sprawdzenie konfliktów wymaga dodatkowych zapytań do bazy danych, ale przy odpowiednim indeksowaniu jest to operacja bardzo szybka.
- Zaleca się użycie transakcji lub atomowego podejścia przy sprawdzaniu i zapisie, choć przy edycji pojedynczego zasobu ryzyko jest minimalne.

## 9. Etapy wdrożenia

1.  **DTO**:
    - Utworzyć `UpdateUnavailabilityDto` rozszerzający `PartialType(CreateUnavailabilityDto)`.
2.  **Serwis (`UnavailabilitiesService`)**:
    - Zaimplementować metodę `update`.
    - Kluczowe: logika wykluczania własnego ID przy sprawdzaniu konfliktów w tabeli `unavailabilities`.
    - Ponowne użycie logiki sprawdzania konfliktów z `create` (z modyfikacją dla wykluczania ID).
3.  **Kontroler (`UnavailabilitiesController`)**:
    - Dodać metodę `update` (`PATCH /unavailabilities/:id`).
    - Dekoratory: `@Patch(':id')`, `@Body()`.
4.  **Testy**:
    - Scenariusz: Zmiana godziny na wolną -> sukces.
    - Scenariusz: Zmiana godziny na zajętą (przez inną niedostępność) -> konflikt.
    - Scenariusz: Zmiana godziny na zajętą (przez rezerwację) -> konflikt.
    - Scenariusz: Edycja cudzego wpisu -> not found.

