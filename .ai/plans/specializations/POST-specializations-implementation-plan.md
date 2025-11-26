# API Endpoint Implementation Plan: POST /specializations

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia tworzenie nowych specjalizacji w systemie. Jest to operacja administracyjna, dostępna wyłącznie dla użytkowników z rolą `ADMIN`. Endpoint przyjmuje nazwę specjalizacji i zapisuje ją w bazie danych, jeśli nazwa nie jest już zajęta.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/specializations`
- **Request Body**:
  ```json
  {
    "name": "string"
  }
  ```
- **Parametry**:
  - **Wymagane**:
    - `name` (w ciele żądania): Nazwa nowej specjalizacji. Musi być unikalna, niepusta i mieć maksymalnie 255 znaków.
  - **Opcjonalne**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:

  - `CreateSpecializationDto`: Klasa używana do walidacji danych przychodzących w ciele żądania.

    ```typescript
    import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

    export class CreateSpecializationDto {
      @IsString()
      @IsNotEmpty()
      @MaxLength(255)
      readonly name: string
    }
    ```

- **Encja**:

  - `Specialization`: Encja TypeORM reprezentująca wpis w tabeli `specializations`. Używana do interakcji z bazą danych i jako model odpowiedzi.

    ```typescript
    @Entity({ name: 'specializations' })
    export class Specialization {
      @PrimaryGeneratedColumn('uuid')
      id: string

      @Column({ type: 'varchar', length: 255, unique: true })
      name: string
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`201 Created`)**:
  - Zwraca nowo utworzony obiekt specjalizacji.
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Nowa specjalizacja"
  }
  ```
- **Błąd**:
  - Zobacz sekcję "Obsługa błędów". Odpowiedzi błędów będą zgodne ze standardowym formatem NestJS.
  ```json
  {
    "statusCode": 400,
    "message": ["name should not be empty"],
    "error": "Bad Request"
  }
  ```

## 5. Przepływ danych

1.  Użytkownik (Admin) wysyła żądanie `POST` na adres `/specializations` z ciałem zawierającym `name`.
2.  Żądanie jest przechwytywane przez `SpecializationsController`.
3.  Uruchamiane są guardy:
    - `JwtAuthGuard` weryfikuje token JWT.
    - `RolesGuard` sprawdza, czy użytkownik ma rolę `ADMIN`.
4.  `ValidationPipe` (globalny) waliduje ciało żądania na podstawie `CreateSpecializationDto`.
5.  Jeśli walidacja i autoryzacja przejdą pomyślnie, kontroler wywołuje metodę `create()` w `SpecializationsService`, przekazując DTO.
6.  `SpecializationsService`:
    - Sprawdza w bazie danych, czy specjalizacja o tej samej nazwie już istnieje. Jeśli tak, rzuca `ConflictException`.
    - Tworzy nową instancję encji `Specialization`.
    - Używa repozytorium TypeORM do zapisania nowej encji w tabeli `specializations`.
    - Zwraca zapisaną encję do kontrolera.
7.  Kontroler zwraca otrzymany obiekt specjalizacji z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Żądania bez ważnego tokenu JWT zostaną odrzucone z kodem `401 Unauthorized`.
- **Autoryzacja**: Endpoint musi być chroniony przez `RolesGuard`, który zezwala na dostęp tylko użytkownikom z rolą `ADMIN`. Próby dostępu przez innych użytkowników zostaną zablokowane z kodem `403 Forbidden`.
- **Walidacja danych**: `ValidationPipe` z opcjami `{ whitelist: true, forbidNonWhitelisted: true }` zapewni, że tylko pole `name` zostanie przyjęte, a wszelkie dodatkowe pola w ciele żądania spowodują błąd `400 Bad Request`.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy dane wejściowe nie przejdą walidacji (np. brak pola `name`, `name` nie jest stringiem, jest puste lub przekracza 255 znaków).
- **`401 Unauthorized`**: Zwracany, gdy żądanie nie zawiera prawidłowego tokenu uwierzytelniającego.
- **`403 Forbidden`**: Zwracany, gdy uwierzytelniony użytkownik nie ma uprawnień administratora.
- **`409 Conflict`**: Zwracany, gdy specjalizacja o podanej nazwie już istnieje.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanego błędu serwera, np. problemu z połączeniem z bazą danych.

## 8. Rozważania dotyczące wydajności

- Operacja jest prosta i nie powinna powodować problemów z wydajnością.
- Zapytanie sprawdzające unikalność nazwy (`SELECT`) oraz zapytanie tworzące nowy rekord (`INSERT`) są bardzo szybkie.
- Na kolumnie `name` w tabeli `specializations` znajduje się indeks `UNIQUE`, co dodatkowo przyspiesza sprawdzanie unikalności.

## 9. Etapy wdrożenia

1.  **Struktura Modułu**:
    - Utworzyć folder `src/specializations`.
    - Wewnątrz utworzyć `specializations.module.ts`, `specializations.controller.ts`, `specializations.service.ts`.
2.  **Encja i DTO**:
    - Upewnić się, że encja `Specialization` w `src/specializations/entities/specialization.entity.ts` jest poprawnie zdefiniowana.
    - Utworzyć plik `src/specializations/dto/create-specialization.dto.ts` z zawartością opisaną w sekcji "Wykorzystywane typy".
3.  **Serwis (`SpecializationsService`)**:
    - Wstrzyknąć repozytorium TypeORM dla encji `Specialization` (`@InjectRepository(Specialization)`).
    - Zaimplementować metodę `async create(createDto: CreateSpecializationDto): Promise<Specialization>`:
      - Sprawdzić unikalność nazwy za pomocą `this.repository.findOneBy({ name: createDto.name })`. Jeśli istnieje, rzucić `new ConflictException(...)`.
      - Utworzyć i zapisać nową encję: `const newSpec = this.repository.create(createDto); await this.repository.save(newSpec);`.
      - Zwrócić `newSpec`.
4.  **Kontroler (`SpecializationsController`)**:
    - Zdefiniować metodę `create` dla ścieżki `POST /specializations`.
    - Użyć dekoratorów `@Post()`, `@HttpCode(HttpStatus.CREATED)`.
    - Zabezpieczyć metodę dekoratorami `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles('ADMIN')`.
    - Przyjąć ciało żądania z dekoratorem `@Body()` i zwalidować je za pomocą `CreateSpecializationDto`.
    - Wywołać metodę `specializationsService.create()` i zwrócić jej wynik.
    - Dodać adnotacje `@ApiCreatedResponse`, `@ApiBadRequestResponse` itd. dla dokumentacji Swagger.
5.  **Moduł (`SpecializationsModule`)**:
    - W pliku `specializations.module.ts` zaimportować `TypeOrmModule.forFeature([Specialization])`.
    - Dodać `SpecializationsController` i `SpecializationsService` do odpowiednich tablic (`controllers`, `providers`).
    - Zaimportować `SpecializationsModule` w głównym `AppModule`.
6.  **Testy**:
    - Dodać testy jednostkowe dla `SpecializationsService`, sprawdzające logikę tworzenia i obsługę konfliktu nazw.
    - Dodać testy e2e dla `POST /specializations`, weryfikujące poprawną walidację, autoryzację, tworzenie zasobu i obsługę błędów.
