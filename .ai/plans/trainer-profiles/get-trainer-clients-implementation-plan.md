# API Endpoint Implementation Plan: Get Trainer Clients

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia zalogowanemu trenerowi pobranie listy wszystkich unikalnych klientów (użytkowników z rolą `CLIENT`), którzy mają historię rezerwacji u tego trenera (statusy: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`). Endpoint jest wykorzystywany m.in. przy tworzeniu planów treningowych, aby umożliwić trenerowi wybór klienta z listy.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/trainer/clients`
- **Uwierzytelnianie:** Wymagany Token JWT (Bearer Token)
- **Rola Użytkownika:** `TRAINER`
- **Parametry:**
    - **Wymagane:** Brak (ID trenera pobierane z tokenu JWT)
    - **Opcjonalne:** Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy

### Data Transfer Objects (DTO)

Będzie konieczne utworzenie nowego DTO reprezentującego dane klienta w odpowiedzi.

**Lokalizacja:** `backend/src/trainer-profiles/dto/trainer-client.response.dto.ts`

```typescript
export class TrainerClientResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}
```

## 4. Szczegóły odpowiedzi

**Status Sukcesu:** `200 OK`

**Struktura Ciała Odpowiedzi (JSON):**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jan Kowalski",
    "email": "jan.kowalski@example.com"
  },
  {
    "id": "987fcdeb-51a2-43c1-z567-123456789012",
    "name": "Anna Nowak",
    "email": "anna.nowak@example.com"
  }
]
```

## 5. Przepływ danych

1.  **Kontroler (`TrainerController`):**
    -   Odbiera żądanie `GET /trainer/clients`.
    -   Weryfikuje token JWT i rolę użytkownika (`TRAINER`) za pomocą Guardów.
    -   Wyciąga `userId` (ID trenera) z obiektu `request.user`.
    -   Przekazuje `userId` do metody serwisu `TrainerProfilesService.getUniqueClients`.

2.  **Serwis (`TrainerProfilesService`):**
    -   Korzysta z wstrzykniętego `BookingRepository`.
    -   Buduje zapytanie (`QueryBuilder`) do tabeli `bookings`.
    -   Filtruje rezerwacje po `trainerId` (równym ID zalogowanego trenera).
    -   Dołącza relację `client` (tabela `users`).
    -   Filtruje użytkowników, upewniając się, że mają rolę `CLIENT`.
    -   Wykonuje selekcję unikalnych klientów (`DISTINCT` po `clientId` lub grupowanie).
    -   Pobiera pola: `id`, `name`, `email` klienta.
    -   Mapuje wyniki na tablicę obiektów `TrainerClientResponseDto`.

3.  **Odpowiedź:**
    -   Zwraca listę klientów jako JSON z kodem 200.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie (Authentication):** Endpoint chroniony przez `JwtAuthGuard`. Tylko zalogowani użytkownicy mają dostęp.
-   **Autoryzacja (Authorization):** Endpoint chroniony przez `RolesGuard` z dekoratorem `@Roles(UserRole.TRAINER)`. Tylko trenerzy mogą pobrać swoją listę klientów.
-   **Izolacja Danych:** Trener ma dostęp wyłącznie do danych użytkowników, którzy dokonali u niego rezerwacji. Nie ma możliwości pobrania klientów innego trenera (ID pobierane z tokenu, a nie z parametru URL).
-   **Minimalizacja Danych:** Zwracane są tylko niezbędne dane klienta (`id`, `name`, `email`), bez danych wrażliwych (hasła, inne dane osobowe).

## 7. Obsługa błędów

| Scenariusz | Kod HTTP | Opis Błędu |
| :--- | :--- | :--- |
| Pomyślne pobranie listy | `200 OK` | Zwraca tablicę klientów (może być pusta). |
| Brak tokenu / Token nieważny | `401 Unauthorized` | Użytkownik nie jest zalogowany. |
| Brak uprawnień (np. Rola CLIENT) | `403 Forbidden` | Użytkownik nie jest trenerem. |
| Błąd serwera | `500 Internal Server Error` | Nieoczekiwany błąd bazy danych lub serwera. |

## 8. Wydajność

-   **Indeksy:** Wykorzystanie istniejących indeksów w tabeli `bookings` (`idx_bookings_trainer_id`) oraz `users` (`PK`).
-   **Query Optimization:** Zapytanie powinno używać `DISTINCT` lub `GROUP BY` na poziomie bazy danych, aby uniknąć pobierania duplikatu danych dla klientów z wieloma rezerwacjami.
-   **Selekcja Pól:** Pobieranie tylko wymaganych kolumn (`id`, `name`, `email`) zamiast całej encji `User`.

## 9. Etapy wdrożenia

### Krok 1: Utworzenie DTO

-   Utwórz plik `backend/src/trainer-profiles/dto/trainer-client.response.dto.ts`.
-   Zdefiniuj klasę `TrainerClientResponseDto` z polami `id`, `name`, `email` oraz dekoratorami `@Expose()`.

### Krok 2: Implementacja Logiki w Serwisie

-   W pliku `backend/src/trainer-profiles/trainer-profiles.service.ts`:
-   Dodaj metodę `getUniqueClients(trainerId: string): Promise<TrainerClientResponseDto[]>`.
-   Zaimplementuj zapytanie przy użyciu `this.bookingRepository` (które jest już wstrzyknięte).
    ```typescript
    // Przykładowa logika QueryBuilder
    const clients = await this.bookingRepository
        .createQueryBuilder("booking")
        .leftJoinAndSelect("booking.client", "client")
        .where("booking.trainerId = :trainerId", { trainerId })
        .andWhere("client.role = :role", { role: UserRole.CLIENT }) // Opcjonalne, jeśli bookings ma FK do users
        .select(["client.id", "client.name", "client.email"])
        .distinctOn(["client.id"]) // PostgreSQL specific
        .getRawMany(); // Lub getMany() i mapowanie
    ```
    *Uwaga: TypeORM `distinctOn` może wymagać specyficznej obsługi lub użycia `groupBy`. Alternatywnie pobierz wszystkie i zrób unikalność w JS (dla małej skali) lub lepiej użyj `DISTINCT` w SQL.*

### Krok 3: Utworzenie Kontrolera

-   Ze względu na wymóg URL `/trainer/clients` (singular), utwórz nowy kontroler `TrainerController` w module `trainer-profiles`.
-   Plik: `backend/src/trainer-profiles/trainer.controller.ts`.
-   Dekorator: `@Controller('trainer')`.
-   Dodaj endpoint:
    ```typescript
    @Get('clients')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TRAINER)
    async getClients(@Request() req): Promise<TrainerClientResponseDto[]>
    ```

### Krok 4: Rejestracja Kontrolera

-   W pliku `backend/src/trainer-profiles/trainer-profiles.module.ts`:
-   Zaimportuj `TrainerController`.
-   Dodaj go do tablicy `controllers`.

### Krok 5: Weryfikacja i Testy

-   Uruchom aplikację.
-   Przetestuj endpoint jako zalogowany trener (powinien zwrócić listę).
-   Przetestuj jako klient (powinien zwrócić 403).
-   Przetestuj bez tokenu (powinien zwrócić 401).
