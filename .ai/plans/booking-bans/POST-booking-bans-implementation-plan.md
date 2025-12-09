# API Endpoint Implementation Plan: POST /booking-bans

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do tworzenia lub aktualizowania blokad rezerwacji dla klientów. Operacja jest dostępna wyłącznie dla administratorów systemu. Umożliwia nałożenie na klienta czasowej blokady możliwości rezerwacji u konkretnego trenera.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/booking-bans`
- **Request Body**:
  ```json
  {
    "clientId": "uuid",
    "trainerId": "uuid",
    "bannedUntil": "ISO_Date_String"
  }
  ```
- **Parametry**:
  - **Wymagane**:
    - `clientId` (w ciele żądania): UUID klienta do zablokowania.
    - `trainerId` (w ciele żądania): UUID trenera, u którego blokada obowiązuje.
    - `bannedUntil` (w ciele żądania): Data w formacie ISO 8601, do kiedy blokada jest aktywna. Musi to być data w przyszłości.
  - **Opcjonalne**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `CreateBookingBanDto`: Klasa używana do walidacji danych przychodzących.
    ```typescript
    import { IsDateString, IsUUID } from 'class-validator';

    export class CreateBookingBanDto {
      @IsUUID()
      readonly clientId: string;

      @IsUUID()
      readonly trainerId: string;

      @IsDateString()
      readonly bannedUntil: string;
    }
    ```
- **Encja**:
  - `BookingBan`: Encja TypeORM reprezentująca wpis w tabeli `booking_bans`.
    ```typescript
    @Entity({ name: "booking_bans" })
    export class BookingBan {
      @PrimaryGeneratedColumn("uuid")
      id: string;

      @Column()
      clientId: string;

      @Column()
      trainerId: string;

      @Column({ type: 'timestamptz' })
      bannedUntil: Date;
      
      // Relacje z encją User...
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`201 Created`)**:
  - Zwraca nowo utworzony lub zaktualizowany obiekt blokady.
  ```json
  {
    "id": "c1d2e3f4-g5h6-7890-1234-567890abcdef",
    "clientId": "a1b2c3d4-...",
    "trainerId": "b1c2d3e4-...",
    "bannedUntil": "2024-01-01T00:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
- **Błąd**:
  - Odpowiedzi błędów będą zgodne ze standardowym formatem NestJS.
  ```json
  {
    "statusCode": 400,
    "message": ["clientId must be a UUID"],
    "error": "Bad Request"
  }
  ```

## 5. Przepływ danych

1.  Administrator wysyła żądanie `POST` na `/booking-bans` z `clientId`, `trainerId` i `bannedUntil`.
2.  `BookingBansController` odbiera żądanie.
3.  Uruchamiane są guardy: `JwtAuthGuard` i `RolesGuard` (`ADMIN`).
4.  `ValidationPipe` waliduje ciało żądania względem `CreateBookingBanDto`.
5.  Kontroler wywołuje metodę `create()` w `BookingBansService`.
6.  `BookingBansService`:
    - Weryfikuje, czy data `bannedUntil` jest w przyszłości. Jeśli nie, rzuca `BadRequestException`.
    - Sprawdza, czy użytkownicy o podanych `clientId` i `trainerId` istnieją w bazie. Jeśli nie, rzuca `BadRequestException`.
    - Wyszukuje istniejącą, aktywną blokadę dla tej pary `clientId` i `trainerId`.
    - **Jeśli aktywna blokada istnieje**: Aktualizuje jej pole `bannedUntil` na nową wartość.
    - **Jeśli aktywna blokada nie istnieje**: Tworzy nową instancję encji `BookingBan`.
    - Zapisuje zmiany w bazie danych za pomocą repozytorium TypeORM.
    - Zwraca zapisaną encję.
7.  Kontroler zwraca obiekt blokady z kodem `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp chroniony przez `JwtAuthGuard`.
- **Autoryzacja**: Dostęp ograniczony do roli `ADMIN` za pomocą `RolesGuard`.
- **Walidacja danych**: `ValidationPipe` z opcjami `{ whitelist: true, forbidNonWhitelisted: true }` zapobiega przyjmowaniu nieoczekiwanych pól. Serwis dodatkowo waliduje logikę biznesową (data w przyszłości, istnienie użytkowników).

## 7. Obsługa błędów

- **`400 Bad Request`**:
  - Błędy walidacji DTO (niepoprawny format danych).
  - Data `bannedUntil` nie jest datą w przyszłości.
  - Użytkownik o podanym `clientId` lub `trainerId` nie istnieje.
- **`401 Unauthorized`**: Brak lub nieważny token JWT.
- **`403 Forbidden`**: Użytkownik nie ma uprawnień administratora.
- **`500 Internal Server Error`**: Błędy po stronie serwera, np. awaria połączenia z bazą danych.

## 8. Rozważania dotyczące wydajności

- Operacja wymaga kilku zapytań do bazy danych (sprawdzenie użytkowników, wyszukanie istniejącej blokady, zapis), ale są one proste i oparte na indeksowanych kolumnach (`id`, `client_id`, `trainer_id`).
- Nie przewiduje się problemów z wydajnością przy normalnym obciążeniu.

## 9. Etapy wdrożenia

1.  **Struktura Modułu**:
    - Upewnić się, że istnieje moduł `BookingBansModule` (`src/booking-bans/`).
2.  **DTO i Encja**:
    - Zweryfikować, czy `CreateBookingBanDto` i encja `BookingBan` są poprawnie zdefiniowane.
3.  **Serwis (`BookingBansService`)**:
    - Wstrzyknąć repozytoria dla `BookingBan` i `User`.
    - Zaimplementować metodę `async create(createDto: CreateBookingBanDto): Promise<BookingBan>`:
        - Walidacja daty `bannedUntil`.
        - Weryfikacja istnienia `clientId` i `trainerId` w repozytorium `User`.
        - Implementacja logiki "znajdź lub stwórz/zaktualizuj".
        - Zapis i zwrot wyniku.
4.  **Kontroler (`BookingBansController`)**:
    - Zdefiniować metodę `create` dla `POST /booking-bans` z dekoratorami `@Post()`, `@HttpCode(201)`.
    - Zabezpieczyć metodę guardami `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles('ADMIN')`.
    - Dodać walidację ciała żądania `@Body()`.
    - Dodać adnotacje Swagger (`@ApiResponse`, `@ApiOperation` itd.).
5.  **Moduł (`BookingBansModule`)**:
    - Upewnić się, że `TypeOrmModule.forFeature([BookingBan, User])` jest zaimportowany.
    - Zarejestrować `BookingBansController` i `BookingBansService`.
    - Zaimportować `BookingBansModule` w `AppModule`.
6.  **Testy**:
    - Dodać testy jednostkowe dla `BookingBansService`, pokrywające logikę tworzenia, aktualizacji i walidacji.
    - Dodać testy e2e dla endpointu, weryfikujące poprawność działania dla różnych scenariuszy (sukces, błędy walidacji, błędy autoryzacji).
