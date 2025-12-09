# API Endpoint Implementation Plan: POST /unavailabilities

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trenerom dodawanie nowych okresów niedostępności do ich harmonogramu. Jest to kluczowa funkcja zarządzania czasem, zapobiegająca umawianiu wizyt w czasie wolnym trenera. System musi dbać o spójność danych, uniemożliwiając dodanie niedostępności, jeśli w tym czasie istnieją już zaakceptowane rezerwacje.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/unavailabilities`
- **Request Body**:
  ```json
  {
    "startTime": "2023-12-24T09:00:00.000Z",
    "endTime": "2023-12-26T17:00:00.000Z"
  }
  ```
- **Parametry Ciała Żądania**:
  - `startTime` (wymagane, `ISO8601 Date`): Data i godzina rozpoczęcia niedostępności.
  - `endTime` (wymagane, `ISO8601 Date`): Data i godzina zakończenia niedostępności.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `CreateUnavailabilityDto`: Klasa wejściowa.
    *Uwaga: Mimo że w wygenerowanych typach może istnieć pole `trainerId`, w kontekście tego endpointu API nie powinno być ono przesyłane przez klienta. Zostanie ono uzupełnione na podstawie tokenu JWT.*
    ```typescript
    import { IsDateString } from 'class-validator';

    export class CreateUnavailabilityDto {
      @IsDateString()
      startTime: string;

      @IsDateString()
      endTime: string;
    }
    ```
  - `UnavailabilityResponseDto`: Zwracany obiekt (jak w GET).

## 4. Szczegóły odpowiedzi

- **Sukces (`201 Created`)**:
  - Zwraca nowo utworzony obiekt niedostępności.
  ```json
  {
    "id": "abc-123-uuid",
    "startTime": "2023-12-24T09:00:00.000Z",
    "endTime": "2023-12-26T17:00:00.000Z",
    "trainerId": "trainer-uuid",
    "createdAt": "..."
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Trener wysyła żądanie `POST` na `/unavailabilities`.
2.  `UnavailabilitiesController` odbiera żądanie.
3.  Guardy `JwtAuthGuard` i `RolesGuard` (`TRAINER`) weryfikują dostęp.
4.  `ValidationPipe` sprawdza poprawność formatu dat w `CreateUnavailabilityDto`.
5.  Kontroler pobiera `trainerId` z `req.user.id`.
6.  Kontroler wywołuje `service.create(trainerId, createDto)`.
7.  `UnavailabilitiesService`:
    - **Walidacja dat**: Sprawdza, czy `startTime` jest wcześniejsze niż `endTime`. Jeśli nie -> `BadRequestException`.
    - **Weryfikacja konfliktów (Niedostępności)**: Sprawdza w tabeli `unavailabilities`, czy dla tego trenera istnieje wpis nakładający się na podany zakres.
    - **Weryfikacja konfliktów (Rezerwacje)**: Sprawdza w tabeli `bookings`, czy dla tego trenera istnieją rezerwacje o statusie `ACCEPTED` w podanym zakresie.
    - Jeśli wykryto konflikt -> `ConflictException` ("Termin jest już zajęty przez rezerwację lub inną niedostępność").
    - Tworzy nową encję `Unavailability`, przypisując `trainerId`.
    - Zapisuje encję w bazie danych.
    - Zwraca utworzoną encję.
8.  Kontroler zwraca obiekt z kodem `201 Created`.

## 6. Względy bezpieczeństwa

- **Weryfikacja tożsamości**: ID trenera (`trainerId`) przypisywane do rekordu MUSI pochodzić z bezpiecznego kontekstu (token JWT), a nie z danych przesłanych przez użytkownika. Zapobiega to tworzeniu niedostępności w imieniu innych trenerów.
- **Spójność biznesowa**: Mechanizm wykrywania konfliktów z istniejącymi rezerwacjami jest krytyczny, aby uniknąć sytuacji, w której trener blokuje termin, na który ma już umówionego klienta.

## 7. Obsługa błędów

- **`400 Bad Request`**:
  - Nieprawidłowy format daty.
  - Data zakończenia jest wcześniejsza niż data rozpoczęcia (`endTime <= startTime`).
- **`401 Unauthorized`**: Brak tokena JWT.
- **`403 Forbidden`**: Użytkownik nie jest trenerem.
- **`409 Conflict`**: W podanym terminie istnieje już inna niedostępność lub zaakceptowana rezerwacja.

## 8. Rozważania dotyczące wydajności

- **Transakcyjność**: Choć operacja dotyczy jednej tabeli (`unavailabilities`), sprawdzenie konfliktów w `bookings` i `unavailabilities` oraz zapis powinny być atomowe lub (w uproszczeniu dla MVP) wykonane sekwencyjnie. Ze względu na małe prawdopodobieństwo "race condition" przy jednym trenerze zarządzającym swoim kalendarzem, prosta sekwencja zapytań jest akceptowalna, ale transakcja na poziomie bazy danych (SERIALIZABLE lub blokada) byłaby najbezpieczniejsza.
- **Indeksy**: Indeks `idx_bookings_trainer_id_start_time` w tabeli `bookings` oraz analogiczny w `unavailabilities` są kluczowe dla szybkiego sprawdzania kolizji.

## 9. Etapy wdrożenia

1.  **DTO**:
    - Upewnić się, że `CreateUnavailabilityDto` (lub jego wariant dla API) zawiera tylko `startTime` i `endTime`.
2.  **Serwis (`UnavailabilitiesService`)**:
    - Wstrzyknąć repozytoria `Unavailability` oraz `Booking` (lub serwis `BookingsService`, jeśli chcemy zachować czystość modułów - w NestJS często wstrzykuje się repozytoria między modułami lub eksportuje serwisy). Zalecane: użycie `BookingRepository` lub `BookingsService` do sprawdzenia kolizji.
    - Zaimplementować metodę `checkConflicts(trainerId, start, end)`.
    - Zaimplementować metodę `create`.
3.  **Kontroler (`UnavailabilitiesController`)**:
    - Dodać metodę `create` (`POST /unavailabilities`).
    - Zastosować dekoratory: `@Post()`, `@UseGuards(...)`, `@Body()`, `@User()`.
4.  **Testy**:
    - Unit testy:
      - Próba dodania z `end < start` -> błąd.
      - Próba dodania na zajęty termin (rezerwacja) -> błąd `Conflict`.
      - Próba dodania na zajęty termin (inna niedostępność) -> błąd `Conflict`.
      - Poprawne dodanie -> sukces.

