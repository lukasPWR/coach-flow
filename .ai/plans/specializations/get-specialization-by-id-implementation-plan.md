# API Endpoint Implementation Plan: GET /specializations/:id

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /specializations/:id` jest odpowiedzialny za pobieranie i zwracanie pojedynczego zasobu specjalizacji na podstawie jego unikalnego identyfikatora (UUID). Jest to publicznie dostępny endpoint służący do odczytu danych słownikowych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/specializations/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator specjalizacji w formacie UUID.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **Encja**: `Specialization`
  - Reprezentacja tabeli `specializations` w bazie danych, zarządzana przez TypeORM.
  - Pola: `id: string`, `name: string`.

- **DTO (Data Transfer Object)**: `SpecializationDto`
  - DTO używane do strukturyzacji odpowiedzi API. Zapewnia to, że tylko publiczne dane są eksponowane.
  - Pola:
    ```typescript
    class SpecializationDto {
      id: string;
      name: string;
    }
    ```

## 4. Szczegóły odpowiedzi

- **Sukces (`200 OK`)**:
  - Zwraca obiekt JSON reprezentujący specjalizację.
  - Przykład:
    ```json
    {
      "id": "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
      "name": "Trening siłowy"
    }
    ```
- **Błędy**:
  - `400 Bad Request`: Zwracany, gdy `id` w URL nie jest w formacie UUID.
  - `404 Not Found`: Zwracany, gdy specjalizacja o podanym `id` nie istnieje w bazie danych.
  - `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1.  Klient wysyła żądanie `GET` na adres `/specializations/:id`.
2.  Framework NestJS kieruje żądanie do metody `findOne` w `SpecializationsController`.
3.  Wbudowany `ParseUUIDPipe` natychmiast waliduje parametr `:id`. Jeśli jest nieprawidłowy, zwraca odpowiedź `400` i przerywa przetwarzanie.
4.  Kontroler wywołuje metodę `findOne(id)` w `SpecializationsService`, przekazując zweryfikowany `id`.
5.  `SpecializationsService` używa repozytorium TypeORM (`SpecializationRepository`) do wyszukania specjalizacji w bazie danych (`SELECT * FROM specializations WHERE id = :id`).
6.  - **Jeśli encja zostanie znaleziona**: Serwis zwraca obiekt encji do kontrolera.
    - **Jeśli encja nie zostanie znaleziona**: Serwis rzuca `NotFoundException`.
7.  Filtr wyjątków NestJS przechwytuje `NotFoundException` i generuje odpowiedź `404 Not Found`.
8.  Kontroler mapuje zwróconą encję na `SpecializationDto` (jeśli jest używane) i wysyła odpowiedź `200 OK` z obiektem JSON do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i autoryzacja**: Endpoint jest publiczny i nie wymaga uwierzytelniania. Jest to akceptowalne, ponieważ dane specjalizacji nie są wrażliwe.
- **Walidacja danych wejściowych**: Parametr `id` jest rygorystycznie walidowany jako UUID za pomocą `ParseUUIDPipe`. Chroni to przed błędami bazy danych i potencjalnymi wektorami ataków związanymi z nieprawidłowymi danymi wejściowymi.
- **Ekspozycja danych**: Zwracany jest tylko `id` i `name`, co zapobiega wyciekowi jakichkolwiek potencjalnie wrażliwych pól, które mogłyby zostać dodane do encji w przyszłości.

## 7. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych**: Zapytanie jest bardzo wydajne, ponieważ opiera się na wyszukiwaniu po kluczu głównym (`id`), który jest domyślnie indeksowany.
- **Wąskie gardła**: Brak przewidywanych wąskich gardeł. Obciążenie dla tego typu endpointu jest minimalne.

## 8. Etapy wdrożenia

1.  **Aktualizacja Encji (`specialization.entity.ts`)**:
    - Upewnić się, że encja `Specialization` jest poprawnie zdefiniowana z dekoratorami TypeORM (`@Entity()`, `@PrimaryGeneratedColumn('uuid')`, `@Column()`).

2.  **Aktualizacja Serwisu (`specializations.service.ts`)**:
    - Wstrzyknąć `SpecializationRepository` do konstruktora: ` @InjectRepository(Specialization) private readonly specializationRepository: Repository<Specialization>`.
    - Zaimplementować metodę `async findOne(id: string): Promise<Specialization>`:
      - Wywołać `this.specializationRepository.findOneBy({ id })`.
      - Jeśli wynik jest `null`, rzucić `new NotFoundException('Specialization not found')`.
      - W przeciwnym razie zwrócić znaleziony obiekt.

3.  **Aktualizacja Kontrolera (`specializations.controller.ts`)**:
    - Zaimplementować metodę `findOne` z dekoratorami:
      ```typescript
      @Get(':id')
      @ApiOperation({ summary: 'Get a single specialization by ID' })
      @ApiResponse({ status: 200, description: 'Returns the specialization.', type: SpecializationDto })
      @ApiResponse({ status: 404, description: 'Specialization not found.' })
      @ApiResponse({ status: 400, description: 'Invalid ID format.' })
      async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SpecializationDto> {
        const specialization = await this.specializationsService.findOne(id);
        // Mapowanie na DTO, jeśli jest używane
        return specialization;
      }
      ```
    - Dodać odpowiednie dekoratory `@nestjs/swagger` (`@ApiOperation`, `@ApiResponse`) w celu udokumentowania endpointu.

4.  **Testy jednostkowe (`specializations.service.spec.ts`)**:
    - Napisać testy dla `SpecializationsService.findOne`:
      - Test pomyślnego znalezienia specjalizacji.
      - Test rzucenia `NotFoundException`, gdy specjalizacja nie istnieje.

5.  **Testy E2E (`specializations.e2e-spec.ts`)**:
    - Napisać testy end-to-end dla endpointu:
      - Test `GET /specializations/:id` z poprawnym ID, oczekując statusu `200` i poprawnego obiektu.
      - Test `GET /specializations/:id` z nieistniejącym (ale poprawnym) UUID, oczekując statusu `404`.
      - Test `GET /specializations/:id` z niepoprawnym ID (np. "123"), oczekując statusu `400`.
