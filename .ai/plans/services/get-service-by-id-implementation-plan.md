# API Endpoint Implementation Plan: GET /services/:id

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /services/:id` służy do pobierania szczegółowych informacji o pojedynczej usłudze na podstawie jej unikalnego identyfikatora (UUID). Zwraca pełny obiekt usługi, w tym powiązane dane, takie jak informacje o trenerze i typie usługi. Punkt końcowy jest przeznaczony dla wszystkich uwierzytelnionych użytkowników.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/services/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (w ścieżce URL): Unikalny identyfikator usługi w formacie UUID.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

### DTOs

#### `ServiceResponseDto`

Główny DTO reprezentujący publiczne dane usługi zwracane przez API.

```typescript
// path: backend/src/services/dto/service-response.dto.ts

import { ApiProperty } from '@nestjs/swagger'

class ServiceTypeDto {
  @ApiProperty({ example: 'c0a8f8a0-4b3f-4c9e-8b1a-0e9e6a3e4b3c' })
  id: string

  @ApiProperty({ example: 'Trening personalny' })
  name: string
}

class TrainerDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string

  @ApiProperty({ example: 'Jan Kowalski' })
  name: string
}

export class ServiceResponseDto {
  @ApiProperty({ example: 'f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c' })
  id: string

  @ApiProperty({ example: 150.0 })
  price: number

  @ApiProperty({ example: 60 })
  durationMinutes: number

  @ApiProperty()
  trainer: TrainerDto

  @ApiProperty()
  serviceType: ServiceTypeDto

  @ApiProperty({ example: '2025-11-08T10:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2025-11-08T10:00:00.000Z' })
  updatedAt: Date
}
```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt JSON zgodny ze strukturą `ServiceResponseDto`.
  ```json
  {
    "id": "f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    "price": 150.0,
    "durationMinutes": 60,
    "trainer": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Jan Kowalski"
    },
    "serviceType": {
      "id": "c0a8f8a0-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
      "name": "Trening personalny"
    },
    "createdAt": "2025-11-08T10:00:00.000Z",
    "updatedAt": "2025-11-08T10:00:00.000Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Gdy `id` w URL nie jest poprawnym UUID.
  - `401 Unauthorized`: Gdy żądanie nie zawiera poprawnego tokenu uwierzytelniającego.
  - `404 Not Found`: Gdy usługa o podanym `id` nie istnieje lub została usunięta (soft delete).
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1.  Użytkownik wysyła żądanie `GET` na adres `/services/{id}`.
2.  Żądanie przechodzi przez `JwtAuthGuard`, który weryfikuje token JWT.
3.  `ValidationPipe` (wraz z `ParseUUIDPipe`) sprawdza, czy parametr `:id` jest poprawnym UUID.
4.  `ServicesController` wywołuje metodę `findOne(id)` z `ServicesService`.
5.  `ServicesService` wykonuje zapytanie do bazy danych (poprzez repozytorium TypeORM) w celu znalezienia usługi o podanym `id`.
    - Zapytanie powinno uwzględniać warunek `deleted_at IS NULL`, aby obsłużyć logikę soft delete.
    - Zapytanie powinno złączyć (`LEFT JOIN`) tabele `users` (dla danych trenera) oraz `service_types` (dla nazwy typu usługi).
6.  Jeśli usługa nie zostanie znaleziona, `ServicesService` rzuca wyjątek `NotFoundException`.
7.  Jeśli usługa zostanie znaleziona, `ServicesService` mapuje wynik z bazy danych na `ServiceResponseDto`.
8.  `ServicesController` zwraca zmapowany obiekt DTO z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony przez `JwtAuthGuard`. Każde żądanie musi zawierać ważny token `Bearer` w nagłówku `Authorization`.
- **Autoryzacja**: Zgodnie z polityką RLS w bazie danych (`FOR SELECT USING (true)`), każdy uwierzytelniony użytkownik może odczytać dane dowolnej usługi. Nie jest wymagana dodatkowa weryfikacja ról.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID za pomocą `ParseUUIDPipe`, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.
- **Ochrona przed wyciekiem danych**: Zwracany jest `ServiceResponseDto`, a nie bezpośrednio encja bazodanowa, co zapobiega przypadkowemu ujawnieniu wrażliwych pól (np. `deleted_at` lub danych z powiązanych encji, które nie powinny być publiczne).

## 7. Rozważania dotyczące wydajności

- **Indeksy bazy danych**: Należy upewnić się, że kolumna `id` w tabeli `services` jest kluczem głównym, co gwarantuje szybkie wyszukiwanie.
- **Optymalizacja zapytań**: Zapytanie pobierające usługę powinno używać `LEFT JOIN` do pobrania powiązanych danych (`trainer` i `serviceType`) w jednym zapytaniu, aby uniknąć problemu N+1.
- **Payload odpowiedzi**: Zwracany obiekt jest stosunkowo mały, więc nie przewiduje się problemów z wydajnością na tym poziomie.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO**:

    - Stworzyć plik `backend/src/services/dto/service-response.dto.ts`.
    - Zdefiniować w nim klasy `ServiceTypeDto`, `TrainerDto` oraz `ServiceResponseDto` wraz z dekoratorami `@ApiProperty()` dla dokumentacji Swagger.

2.  **Aktualizacja `ServicesService`**:

    - W pliku `backend/src/services/services.service.ts` dodać nową metodę `async findOne(id: string): Promise<ServiceResponseDto>`.
    - Wstrzyknąć repozytorium `Service` (`@InjectRepository(Service)`).
    - Zaimplementować logikę wyszukiwania usługi za pomocą `findOne` z TypeORM, dodając warunek `where: { id, deletedAt: null }` oraz relacje `relations: ['trainer', 'serviceType']`.
    - W przypadku braku wyniku, rzucić `new NotFoundException('Service not found')`.
    - Zaimplementować mapowanie wyniku na `ServiceResponseDto`.

3.  **Aktualizacja `ServicesController`**:
    - W pliku `backend/src/services/services.controller.ts` dodać nową metodę dla endpointu `GET /services/:id`.
    - Użyć dekoratorów:
      - `@Get(':id')`
      - `@UseGuards(JwtAuthGuard)`
      - `@ApiOperation({ summary: 'Get a single service by ID' })`
      - `@ApiResponse({ status: 200, description: 'Service found.', type: ServiceResponseDto })`
      - `@ApiResponse({ status: 404, description: 'Service not found.' })`
      - `@ApiResponse({ status: 401, description: 'Unauthorized.' })`
    - W metodzie kontrolera przyjąć `id` jako parametr z dekoratorem `@Param('id', ParseUUIDPipe)`.
    - Wywołać metodę `this.servicesService.findOne(id)` i zwrócić jej wynik.
