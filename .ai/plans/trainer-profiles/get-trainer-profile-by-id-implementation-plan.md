# API Endpoint Implementation Plan: GET /trainer-profiles/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do pobierania szczegółowych informacji o pojedynczym profilu trenera na podstawie jego unikalnego identyfikatora (ID). Odpowiedź będzie zawierać publiczne dane profilu, w tym informacje o użytkowniku (imię) oraz listę powiązanych specjalizacji. Dostęp do tego zasobu jest publiczny i nie wymaga autoryzacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/trainer-profiles/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki URL): Unikalny identyfikator (UUID) profilu trenera, który ma zostać pobrany.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

### DTO (Data Transfer Object)

- **`TrainerProfileResponseDto`**: Nowy DTO, który zostanie utworzony w celu kontrolowania struktury odpowiedzi. Będzie zawierał wybrane pola z encji `TrainerProfile`, `User` i `Specialization`.

  ```typescript
  // backend/src/trainer-profiles/dto/trainer-profile-response.dto.ts

  class SpecializationDto {
    id: string
    name: string
  }

  export class TrainerProfileResponseDto {
    id: string
    userId: string
    trainerName: string // Pole z połączonej encji User
    description: string | null
    city: string | null
    profilePictureUrl: string | null
    specializations: SpecializationDto[]
    createdAt: Date
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt `TrainerProfileResponseDto` zawierający dane profilu trenera.

  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "userId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "trainerName": "Jan Kowalski",
    "description": "Doświadczony trener personalny z 10-letnim stażem.",
    "city": "Warszawa",
    "profilePictureUrl": "https://example.com/profile.jpg",
    "specializations": [
      { "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12", "name": "Trening siłowy" },
      { "id": "d4e5f6a7-b8c9-0123-4567-890abcdef123", "name": "Dietetyka" }
    ],
    "createdAt": "2025-11-16T10:00:00.000Z"
  }
  ```

- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `id` nie jest prawidłowym UUID.
  - `404 Not Found`: Jeśli profil o podanym `id` nie istnieje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych problemów z serwerem.

## 5. Przepływ danych

1.  Klient wysyła żądanie `GET` na adres `/trainer-profiles/{id}`.
2.  Routing NestJS kieruje żądanie do metody `findOne` w `TrainerProfilesController`.
3.  Dekorator `@Param('id', ParseUUIDPipe)` waliduje format `id`. Jeśli jest nieprawidłowy, natychmiast zwracany jest błąd `400`.
4.  Kontroler wywołuje metodę `findOne(id)` w `TrainerProfilesService`.
5.  Serwis używa `TypeORM Repository` (`TrainerProfilesRepository`) do wyszukania profilu w bazie danych. Zapytanie musi zawierać relacje do tabel `users` (w celu pobrania imienia) i `trainer_specializations` -> `specializations` (w celu pobrania nazw specjalizacji).
6.  Jeśli repozytorium nie znajdzie profilu, serwis rzuca wyjątek `NotFoundException`, co skutkuje odpowiedzią `404`.
7.  Jeśli profil zostanie znaleziony, serwis mapuje wynik (encję `TrainerProfile` wraz z relacjami) na `TrainerProfileResponseDto`.
8.  Serwis zwraca DTO do kontrolera.
9.  Kontroler zwraca `TrainerProfileResponseDto` jako odpowiedź HTTP z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Walidacja danych wejściowych**: Użycie `ParseUUIDPipe` chroni przed atakami polegającymi na wstrzykiwaniu złośliwych danych w parametrze URL (np. SQL Injection, chociaż ORM w dużym stopniu przed tym chroni).
- **Kontrola dostępu**: Zgodnie ze specyfikacją, punkt końcowy jest publiczny. Nie będzie stosowany `JwtAuthGuard`. Należy upewnić się, że odpowiedź nie zawiera żadnych wrażliwych danych (np. e-mail, hash hasła).
- **Zarządzanie zależnościami**: Wszystkie zależności (`class-validator`, `class-transformer`) powinny być utrzymywane w aktualnych wersjach.

## 7. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych**: Należy zoptymalizować zapytanie, aby uniknąć problemu N+1. Użycie `leftJoinAndSelect` w TypeORM lub `relations` w opcjach `findOne` pozwoli na pobranie wszystkich potrzebnych danych w jednym zapytaniu SQL.
- **Indeksowanie**: Kolumna `id` w tabeli `trainer_profiles` jest kluczem głównym, więc jest domyślnie zindeksowana, co zapewnia szybkie wyszukiwanie.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO**:

    - Stwórz plik `backend/src/trainer-profiles/dto/trainer-profile-response.dto.ts`.
    - Zdefiniuj w nim klasy `SpecializationDto` i `TrainerProfileResponseDto` zgodnie z sekcją 3.

2.  **Aktualizacja serwisu (`TrainerProfilesService`)**:

    - Wstrzyknij `Repository<TrainerProfile>` do serwisu.
    - Zaimplementuj metodę `async findOne(id: string): Promise<TrainerProfileResponseDto>`.
    - Wewnątrz metody użyj `trainerProfileRepository.findOne` z opcją `relations` lub `leftJoinAndSelect` do pobrania profilu wraz z relacjami `user` i `specializations`.
      ```typescript
      // Przykład użycia relations
      const profile = await this.trainerProfileRepository.findOne({
        where: { id },
        relations: ['user', 'specializations'],
      })
      ```
    - Sprawdź, czy profil istnieje. Jeśli nie, rzuć `new NotFoundException('Trainer profile not found')`.
    - Zmapuj znalezioną encję na `TrainerProfileResponseDto`.

3.  **Aktualizacja kontrolera (`TrainerProfilesController`)**:

    - Dodaj nową metodę `findOne` obsługującą żądanie `GET /:id`.
    - Użyj dekoratorów `@Get(':id')`, `@Param('id', ParseUUIDPipe)`, `@ApiResponse` i `@ApiTags`.
    - W metodzie wywołaj `this.trainerProfilesService.findOne(id)` i zwróć wynik.
    - Dodaj dekoratory Swaggera (`@ApiOperation`, `@ApiResponse`) w celu udokumentowania punktu końcowego.

4.  **Testowanie**:
    - **Testy jednostkowe**: Napisz testy dla `TrainerProfilesService`, sprawdzając:
      - Poprawne zwracanie DTO, gdy profil istnieje.
      - Rzucanie `NotFoundException`, gdy profil nie istnieje.
    - **Testy E2E**: Napisz testy end-to-end dla kontrolera, które zweryfikują:
      - Poprawną odpowiedź `200 OK` z danymi dla istniejącego ID.
      - Odpowiedź `404 Not Found` dla nieistniejącego ID.
      - Odpowiedź `400 Bad Request` dla nieprawidłowego formatu UUID.
