# API Endpoint Implementation Plan: GET /service-types & GET /service-types/:id

## 1. Przegląd punktu końcowego

Ten plan obejmuje implementację dwóch powiązanych ze sobą punktów końcowych przeznaczonych do odczytu danych słownikowych o typach usług:

1.  **`GET /service-types`**: Zwraca listę wszystkich dostępnych typów usług w systemie.
2.  **`GET /service-types/:id`**: Zwraca pojedynczy typ usługi na podstawie jego unikalnego identyfikatora (UUID).

Punkty te są kluczowe dla modułów, które muszą prezentować użytkownikowi predefiniowane kategorie usług, np. podczas tworzenia nowej usługi przez trenera.

## 2. Szczegóły żądania

### `GET /service-types`

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/service-types`
-   **Parametry**:
    -   Wymagane: Brak
    -   Opcjonalne: Brak
-   **Request Body**: Brak

### `GET /service-types/:id`

-   **Metoda HTTP**: `GET`
-   **Struktura URL**: `/service-types/:id`
-   **Parametry**:
    -   Wymagane:
        -   `id` (w ścieżce URL): Unikalny identyfikator UUID typu usługi.
    -   Opcjonalne: Brak
-   **Request Body**: Brak

## 3. Wykorzystywane typy

### DTO Odpowiedzi

W celu zapewnienia spójnego i kontrolowanego formatu odpowiedzi, zostanie utworzony `ServiceTypeDto`.

**`ServiceTypeDto`**

```typescript
// Plik: backend/src/service-types/dto/service-type.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ServiceTypeDto {
  @ApiProperty({
    description: 'Unikalny identyfikator typu usługi',
    example: 'c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nazwa typu usługi',
    example: 'Trening personalny',
  })
  name: string;
}
```

## 4. Szczegóły odpowiedzi

### `GET /service-types`

-   **Odpowiedź sukcesu (`200 OK`)**: Zwraca tablicę obiektów `ServiceTypeDto`.
    ```json
    [
      {
        "id": "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
        "name": "Trening personalny"
      },
      {
        "id": "d1e2f3a4-b5c6-7890-1234-567890abcdef",
        "name": "Konsultacja dietetyczna"
      }
    ]
    ```
-   **Odpowiedź błędu (`500 Internal Server Error`)**: Występuje w przypadku problemów z połączeniem z bazą danych.

### `GET /service-types/:id`

-   **Odpowiedź sukcesu (`200 OK`)**: Zwraca pojedynczy obiekt `ServiceTypeDto`.
    ```json
    {
      "id": "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
      "name": "Trening personalny"
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Przekazany parametr `id` nie jest w formacie UUID.
    -   `404 Not Found`: Nie znaleziono typu usługi o podanym `id`.
    -   `500 Internal Server Error`: Występuje w przypadku problemów z połączeniem z bazą danych.

## 5. Przepływ danych

1.  Klient wysyła żądanie `GET` do jednego z endpointów.
2.  Żądanie jest przechwytywane przez `ServiceTypesController`.
3.  Dla `GET /service-types/:id`, `ParseUUIDPipe` waliduje format `id`.
4.  Kontroler wywołuje odpowiednią metodę w `ServiceTypesService` (`findAll` lub `findOne`).
5.  Serwis używa wstrzykniętego repozytorium TypeORM (`Repository<ServiceType>`) do wykonania zapytania do bazy danych PostgreSQL.
6.  Baza danych zwraca dane do serwisu.
7.  Dla `findOne`, jeśli dane nie zostaną znalezione, serwis rzuca wyjątek `NotFoundException`.
8.  Serwis zwraca dane (encje) do kontrolera.
9.  Kontroler mapuje encje na `ServiceTypeDto` (jawnie lub niejawnie) i zwraca odpowiedź HTTP do klienta.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie i autoryzacja**: Specyfikacja API nie wymaga zabezpieczeń dla tych punktów końcowych, co czyni je publicznie dostępnymi. Należy to potwierdzić z zespołem. Jeśli dane te są wrażliwe, należy dodać `JwtAuthGuard`.
-   **Walidacja danych wejściowych**: Parametr `:id` jest walidowany za pomocą `ParseUUIDPipe`, co zapobiega błędom i potencjalnym atakom (np. SQL Injection, chociaż TypeORM zapewnia ochronę) wynikającym z nieprawidłowego formatu danych wejściowych.

## 7. Rozważania dotyczące wydajności

-   **Paginacja**: Endpoint `GET /service-types` obecnie zwraca wszystkie rekordy. Liczba typów usług jest spodziewana jako niewielka (dane słownikowe), więc paginacja nie jest wymagana w MVP. Jeśli liczba ta znacznie wzrośnie, należy zaimplementować paginację, aby uniknąć problemów z wydajnością i pamięcią.
-   **Indeksowanie**: Kolumna `id` w tabeli `service_types` jest kluczem głównym, co oznacza, że jest domyślnie zindeksowana. Zapewnia to wysoką wydajność wyszukiwania dla endpointu `GET /service-types/:id`.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO odpowiedzi**:
    -   Utwórz plik `backend/src/service-types/dto/service-type.dto.ts`.
    -   Zdefiniuj w nim klasę `ServiceTypeDto` z polami `id` i `name`, dodając dekoratory `@ApiProperty` dla dokumentacji Swagger.

2.  **Aktualizacja serwisu (`ServiceTypesService`)**:
    -   Otwórz plik `backend/src/service-types/service-types.service.ts`.
    -   Dodaj metodę `findAll(): Promise<ServiceType[]>` która używa `this.serviceTypeRepository.find()` do pobrania wszystkich rekordów.
    -   Dodaj metodę `findOne(id: string): Promise<ServiceType>` która używa `this.serviceTypeRepository.findOneBy({ id })`. W przypadku braku rekordu, metoda powinna rzucić `NotFoundException`.
    -   Dodaj obsługę błędów `InternalServerErrorException` z logowaniem dla obu metod.

3.  **Aktualizacja kontrolera (`ServiceTypesController`)**:
    -   Otwórz plik `backend/src/service-types/service-types.controller.ts`.
    -   Dodaj metodę `findAll()` obsługującą `GET /` z dekoratorami `@Get()` i `@ApiResponse`.
    -   Dodaj metodę `findOne()` obsługującą `GET /:id` z dekoratorami `@Get(':id')` i `@ApiResponse`.
    -   W metodzie `findOne`, użyj `@Param('id', ParseUUIDPipe) id: string` do walidacji parametru.
    -   Użyj dekoratorów `@ApiOperation`, `@ApiResponse` itd. aby w pełni udokumentować nowe endpointy w Swaggerze, zgodnie z istniejącym stylem w kontrolerze.
    -   Upewnij się, że obie metody zwracają odpowiednie DTO (`Promise<ServiceTypeDto[]>` i `Promise<ServiceTypeDto>`).


