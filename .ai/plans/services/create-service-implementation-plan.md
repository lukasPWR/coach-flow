# API Endpoint Implementation Plan: POST /services

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia tworzenie nowych usług, które mogą być oferowane przez trenerów. Endpoint jest kluczowym elementem modułu `Services`, pozwalającym na definiowanie cennika i oferty trenera. W obecnej wersji endpoint jest publiczny i nie wymaga uwierzytelniania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/services`
- **Ciało Żądania**: `application/json`

  ```json
  {
    "trainerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "serviceTypeId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "price": 150.0,
    "durationMinutes": 60
  }
  ```

- **Parametry**:
  - **Wymagane w ciele żądania**:
    - `trainerId: string` (UUID) - Identyfikator istniejącego trenera.
    - `serviceTypeId: string` (UUID) - Identyfikator istniejącego typu usługi.
    - `price: number` - Cena usługi, nie może być ujemna.
    - `durationMinutes: number` (integer) - Czas trwania usługi w minutach, musi być liczbą dodatnią.
  - **Opcjonalne**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:

  - `CreateServiceDto`: Obiekt używany do walidacji danych wejściowych z ciała żądania.

    ```typescript
    // backend/src/services/dto/create-service.dto.ts
    import { IsInt, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator'

    export class CreateServiceDto {
      @IsUUID()
      @IsNotEmpty()
      readonly trainerId: string

      @IsUUID()
      @IsNotEmpty()
      readonly serviceTypeId: string

      @IsNumber()
      @Min(0)
      readonly price: number

      @IsInt()
      @Min(1)
      readonly durationMinutes: number
    }
    ```

- **Encja**:
  - `Service`: Encja TypeORM odpowiadająca tabeli `services` w bazie danych.

## 4. Przepływ danych

1.  Żądanie `POST /services` dociera do serwera.
2.  **Kontroler (`ServicesController`)**:
    - Metoda oznaczona `@Post()` jest wywoływana.
    - Globalny `ValidationPipe` waliduje i transformuje ciało żądania na instancję `CreateServiceDto`.
    - Wywoływana jest metoda `servicesService.create(createServiceDto)`.
3.  **Serwis (`ServicesService`)**:
    - Metoda `create` otrzymuje DTO.
    - Wykorzystuje wstrzyknięte **repozytoria** (`UserRepository`, `ServiceTypeRepository`) do sprawdzenia, czy `User` (trener) o podanym `trainerId` oraz `ServiceType` o podanym `serviceTypeId` istnieją. Jeśli któryś nie istnieje, rzuca `NotFoundException`.
    - Tworzona jest nowa instancja encji `Service` z danymi z DTO.
    - Wykorzystuje wstrzyknięte **repozytorium** (`ServiceRepository`) i jego metodę `.save()` do zapisania nowej encji w tabeli `services`.
    - Zapisana encja jest zwracana do kontrolera.
4.  **Kontroler**:
    - Zwraca nowo utworzony obiekt usługi w odpowiedzi z kodem statusu `201 Created`.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie i Autoryzacja**: **Celowo pominięte w obecnej wersji.** Endpoint jest publicznie dostępny. Należy mieć świadomość, że oznacza to, iż każdy może utworzyć usługę dla dowolnego trenera, o ile zna jego ID. Jest to tymczasowe uproszczenie i w docelowym rozwiązaniu należy przywrócić uwierzytelnianie JWT i autoryzację opartą na rolach.
- **Walidacja danych wejściowych**:
  - Globalny `ValidationPipe` z opcjami `whitelist: true` i `forbidNonWhitelisted: true` zapobiega atakom typu Mass Assignment poprzez odrzucanie pól, które nie są zdefiniowane w `CreateServiceDto`.
  - `class-validator` zapewnia, że wszystkie dane mają poprawne typy i wartości (np. `price` nie jest ujemny).
- **Integralność danych**: Serwis weryfikuje istnienie `trainerId` i `serviceTypeId` w bazie danych przed utworzeniem rekordu.

## 6. Obsługa błędów

Wszystkie błędy będą przechwytywane przez globalny `HttpExceptionFilter`, który zapewni spójny format odpowiedzi JSON.

| Kod Statusu                 | Sytuacja                                                                                                     | Przykładowa odpowiedź                                                                         |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `400 Bad Request`           | Błąd walidacji DTO (np. brak wymaganego pola, zły typ danych, wartość poza zakresem).                        | `{ "statusCode": 400, "message": ["price must not be less than 0"], "error": "Bad Request" }` |
| `404 Not Found`             | Podany `trainerId` lub `serviceTypeId` nie odpowiada żadnemu istniejącemu rekordowi w odpowiednich tabelach. | `{ "statusCode": 404, "message": "Trainer with ID '...' not found", "error": "Not Found" }`   |
| `500 Internal Server Error` | Błąd połączenia z bazą danych lub inny nieoczekiwany błąd serwera.                                           | `{ "statusCode": 500, "message": "Internal server error" }`                                   |

## 7. Rozważania dotyczące wydajności

- **Zapytania do bazy danych**: Endpoint wykonuje dwa zapytania `SELECT` (w celu weryfikacji `trainerId` i `serviceTypeId`) i jedno zapytanie `INSERT`. Są to operacje o niskim koszcie.
- **Indeksy**: Klucze obcek (`trainer_id`, `service_type_id`) powinny być zindeksowane, co jest standardową praktyką i zostało przewidziane w `db-plan.md`.
- **Skalowalność**: Endpoint jest bezstanowy i jego wydajność nie powinna degradować się wraz ze wzrostem liczby usług. Nie przewiduje się wąskich gardeł.

## 8. Etapy wdrożenia

1.  **Struktura Modułu**:
    - Upewnić się, że istnieje moduł `ServicesModule` (`backend/src/services/services.module.ts`).
    - Zweryfikować, czy `ServicesController`, `ServicesService` oraz `Service` (encja TypeORM) są zdefiniowane i zaimportowane w module.
2.  **DTO (Data Transfer Object)**:
    - Utworzyć lub zaktualizować plik `backend/src/services/dto/create-service.dto.ts`.
    - Zaimplementować klasę `CreateServiceDto` z polem `trainerId` i odpowiednimi dekoratorami `class-validator` zgodnie z sekcją 3.
3.  **Encja**:
    - Upewnić się, że encja `Service` (`backend/src/services/entities/service.entity.ts`) jest poprawnie zdefiniowana.
4.  **Logika Serwisu (`ServicesService`)**:
    - Wstrzyknąć **repozytoria** TypeORM dla `Service`, `User` i `ServiceType` do serwisu za pomocą dekoratora `@InjectRepository()`.
    - Zaimplementować metodę `async create(createServiceDto: CreateServiceDto): Promise<Service>`.
    - Dodać logikę weryfikującą istnienie `trainerId` i `serviceTypeId` przy użyciu wstrzykniętych repozytoriów.
    - Dodać logikę tworzenia i zapisywania nowej usługi za pomocą repozytorium `Service`.
5.  **Logika Kontrolera (`ServicesController`)**:
    - Zdefiniować metodę `create(@Body() createServiceDto: CreateServiceDto)` z dekoratorem `@Post()`.
    - Usunąć wszystkie guardy (`@UseGuards`) i dekoratory ról.
    - Wywołać serwis z przekazanym DTO i zwrócić wynik z kodem `201`.
