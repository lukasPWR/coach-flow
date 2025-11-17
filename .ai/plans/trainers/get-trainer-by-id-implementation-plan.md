# API Endpoint Implementation Plan: GET /trainers/:id

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest dostarczenie publicznie dostępnych, szczegółowych informacji o profilu trenera na podstawie jego unikalnego identyfikatora użytkownika (`userId`). Odpowiedź będzie zawierać podstawowe dane trenera, jego specjalizacje oraz listę oferowanych usług. Endpoint jest przeznaczony do użytku publicznego i nie wymaga uwierzytelniania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/trainers/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): UUID użytkownika (`User`) z rolą `TRAINER`.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane lub stworzone następujące DTO, aby zapewnić spójność i walidację danych odpowiedzi:

- **`PublicTrainerProfileResponseDto`**: Główny obiekt odpowiedzi.

  ```typescript
  class PublicTrainerProfileResponseDto {
    @ApiProperty()
    id: string // User ID

    @ApiProperty()
    name: string

    @ApiPropertyOptional()
    city?: string

    @ApiPropertyOptional()
    description?: string

    @ApiPropertyOptional()
    profilePictureUrl?: string

    @ApiProperty({ type: () => [SpecializationDto] })
    specializations: SpecializationDto[]

    @ApiProperty({ type: () => [ServiceResponseDto] })
    services: ServiceResponseDto[]
  }
  ```

- **`SpecializationDto`**: Reprezentacja pojedynczej specjalizacji.

  ```typescript
  class SpecializationDto {
    @ApiProperty()
    id: string

    @ApiProperty()
    name: string
  }
  ```

- **`ServiceResponseDto`**: Reprezentacja pojedynczej usługi w odpowiedzi.

  ```typescript
  class ServiceResponseDto {
    @ApiProperty()
    id: string

    @ApiProperty()
    name: string // Nazwa pochodząca z ServiceType

    @ApiProperty()
    price: number

    @ApiProperty()
    durationMinutes: number
  }
  ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**: Zwraca obiekt `PublicTrainerProfileResponseDto` z danymi trenera.
  ```json
  {
    "id": "b1c2d3e4-f5a6-7890-1234-567890abcdef",
    "name": "Anna Nowak",
    "city": "Warszawa",
    "description": "Certyfikowany trener personalny z 10-letnim doświadczeniem.",
    "profilePictureUrl": "https://example.com/profile.jpg",
    "specializations": [
      { "id": "s1...", "name": "Utrata wagi" },
      { "id": "s2...", "name": "Trening siłowy" }
    ],
    "services": [
      {
        "id": "svc1...",
        "name": "Trening personalny",
        "price": 150.0,
        "durationMinutes": 60
      }
    ]
  }
  ```
- **Błędy**:
  - `404 Not Found`: Jeśli trener o podanym `id` nie istnieje lub użytkownik nie ma roli `TRAINER`.
  - `400 Bad Request`: Jeśli podane `id` nie jest prawidłowym UUID.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do `TrainerProfilesController` na metodę `getPublicProfileById(id)`.
2.  `ParseUUIDPipe` waliduje format `id` w parametrze ścieżki.
3.  Kontroler wywołuje metodę `findPublicProfileByUserId(id)` w `TrainerProfilesService`.
4.  Serwis wykonuje zapytanie do bazy danych (przy użyciu TypeORM), aby znaleźć użytkownika (`User`) z podanym `id` i rolą `TRAINER`. Zapytanie powinno połączyć (`JOIN`) następujące tabele:
    - `users` (aby pobrać `name`)
    - `trainer_profiles` (aby pobrać `description`, `city`, `profile_picture_url`)
    - `trainer_specializations` i `specializations` (aby pobrać listę specjalizacji)
    - `services` i `service_types` (aby pobrać listę usług wraz z ich nazwami)
5.  Jeśli zapytanie nie zwróci wyników, serwis rzuca `NotFoundException`.
6.  Serwis mapuje wyniki z bazy danych na strukturę `PublicTrainerProfileResponseDto`.
7.  Kontroler zwraca zmapowany obiekt DTO z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Publiczny dostęp**: Endpoint jest publiczny, więc nie jest wymagane uwierzytelnianie ani autoryzacja.
- **Walidacja wejścia**: `ParseUUIDPipe` chroni przed atakami polegającymi na wstrzykiwaniu złośliwych wartości w parametrze `id`.
- **Ograniczenie danych**: Zapytanie do bazy danych musi precyzyjnie wybierać tylko te kolumny, które są przeznaczone do publicznego widoku. Należy unikać pobierania wrażliwych danych, takich jak `password_hash`, `email` czy `deleted_at`.

## 7. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Kluczowe jest zbudowanie jednego, zoptymalizowanego zapytania SQL (za pomocą TypeORM QueryBuilder), które pobierze wszystkie potrzebne dane za jednym razem, wykorzystując `LEFT JOIN`. Pozwoli to uniknąć problemu N+1 zapytań, szczególnie przy pobieraniu specjalizacji i usług.
- **Indeksowanie**: Kolumna `users.id` jest kluczem głównym i jest domyślnie zindeksowana. Należy upewnić się, że klucze obce (`trainer_profiles.user_id`, `services.trainer_id` etc.) również mają indeksy dla szybszych złączeń.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO**: Zdefiniuj klasy `PublicTrainerProfileResponseDto`, `SpecializationDto` i `ServiceResponseDto` w `backend/src/trainer-profiles/dto/`. Użyj dekoratorów `@ApiProperty` i `@ApiPropertyOptional` dla dokumentacji Swagger.
2.  **Aktualizacja serwisu (`TrainerProfilesService`)**:
    - Wstrzyknij repozytoria dla `User`, `Service` i `Specialization`, jeśli jeszcze nie są dostępne.
    - Zaimplementuj nową metodę asynchroniczną `findPublicProfileByUserId(userId: string): Promise<PublicTrainerProfileResponseDto>`.
    - Wewnątrz metody użyj `QueryBuilder` do skonstruowania zapytania pobierającego wszystkie wymagane dane.
    - Dodaj logikę sprawdzającą, czy znaleziony użytkownik istnieje i ma rolę `TRAINER`. Jeśli nie, rzuć `NotFoundException`.
    - Zmapuj wynik zapytania na instancję `PublicTrainerProfileResponseDto`.
3.  **Aktualizacja kontrolera (`TrainerProfilesController`)**:
    - Dodaj nową metodę `getPublicProfileById(@Param('id', ParseUUIDPipe) id: string)`.
    - Udekoruj metodę za pomocą `@Get(':id')`, `@ApiOperation`, `@ApiResponse({ status: 200, ... })`, `@ApiResponse({ status: 404, ... })`.
    - W ciele metody wywołaj `trainerProfilesService.findPublicProfileByUserId(id)` i zwróć wynik.
4.  **Testowanie**:
    - Dodaj test jednostkowy dla `TrainerProfilesService`, sprawdzając poprawność logiki biznesowej i obsługę przypadku, gdy trener nie istnieje.
    - Dodaj test e2e dla endpointu `GET /trainers/:id`, weryfikując poprawność kodu statusu i struktury odpowiedzi dla istniejącego i nieistniejącego trenera.
