# API Endpoint Implementation Plan: `PATCH /service-types/:id`

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia aktualizację istniejącego typu usługi (`ServiceType`) w systemie. Użytkownik, który musi posiadać uprawnienia administratora, może modyfikować dane typu usługi, takie jak jego nazwa. Endpoint identyfikuje zasób do modyfikacji na podstawie unikalnego identyfikatora (`id`) przekazanego w adresie URL.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `PATCH`
-   **Struktura URL**: `/service-types/:id`
-   **Parametry**:
    -   **Wymagane**:
        -   `id` (w ścieżce URL): Unikalny identyfikator typu usługi, który ma zostać zaktualizowany. Musi być w formacie UUID.
-   **Request Body**: Ciało żądania w formacie `application/json` zawierające pola do aktualizacji.
    ```json
    {
      "name": "Nowa nazwa typu usługi"
    }
    ```
    -   Pola w ciele żądania są opcjonalne. Jeśli pole nie zostanie podane, jego wartość w zasobie nie ulegnie zmianie.

## 3. Wykorzystywane typy

-   **DTO (Data Transfer Object)**:
    -   `UpdateServiceTypeDto`: Klasa DTO do walidacji ciała żądania.
        ```typescript
        import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

        export class UpdateServiceTypeDto {
          @IsOptional()
          @IsString()
          @IsNotEmpty()
          @Length(3, 100)
          name?: string;
        }
        ```
-   **Parametry URL**:
    -   Parametr `:id` będzie walidowany za pomocą `ParseUUIDPipe` w kontrolerze, aby upewnić się, że jest to prawidłowy UUID.

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (`200 OK`)**:
    -   Zwraca pełny obiekt zaktualizowanego typu usługi w formacie `application/json`.
        ```json
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Zaktualizowana nazwa typu usługi",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T12:30:00.000Z"
        }
        ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji danych wejściowych.
    -   `401 Unauthorized`: Brak uwierzytelnienia.
    -   `403 Forbidden`: Brak wymaganych uprawnień (rola inna niż `ADMIN`).
    -   `404 Not Found`: Zasób o podanym `id` nie został znaleziony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do `ServiceTypesController` na endpoint `/service-types/:id`.
2.  Uruchamiane są `Guards` w celu weryfikacji uwierzytelnienia (`JwtAuthGuard`) i autoryzacji (`RolesGuard` sprawdzający rolę `ADMIN`).
3.  `ParseUUIDPipe` waliduje parametr `id` z adresu URL.
4.  `ValidationPipe` waliduje ciało żądania przy użyciu `UpdateServiceTypeDto`.
5.  Kontroler wywołuje metodę `update(id, updateServiceTypeDto)` z `ServiceTypesService`.
6.  Serwis wyszukuje encję `ServiceType` w bazie danych przy użyciu przekazanego `id`.
    -   Jeśli encja nie istnieje, serwis rzuca `NotFoundException`.
7.  Serwis aktualizuje pola encji na podstawie danych z DTO.
8.  Zaktualizowana encja jest zapisywana w bazie danych.
9.  Serwis zwraca zaktualizowaną encję do kontrolera.
10. Kontroler serializuje odpowiedź i wysyła ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony przez `JwtAuthGuard`, który weryfikuje poprawność tokenu JWT.
-   **Autoryzacja**: Dostęp musi być ograniczony do użytkowników z rolą `ADMIN`. Należy użyć `RolesGuard` oraz dekoratora `@Roles('ADMIN')`.
-   **Walidacja danych wejściowych**:
    -   Parametr `id` musi być walidowany jako UUID, aby zapobiec atakom na bazę danych.
    -   Ciało żądania musi być walidowane przez `UpdateServiceTypeDto` z użyciem `class-validator` i globalnego `ValidationPipe`, co chroni przed wstrzykiwaniem złośliwych danych.
-   **Bezpieczne nagłówki**: Aplikacja powinna mieć globalnie włączony `helmet` w celu ochrony przed znanymi podatnościami webowymi.

## 7. Rozważania dotyczące wydajności

-   Operacja jest prostym zapytaniem `UPDATE` do bazy danych, indeksowanym po kluczu głównym (`id`), więc nie przewiduje się problemów z wydajnością.
-   Należy upewnić się, że zapytanie do bazy danych jest zoptymalizowane i aktualizuje tylko niezbędne pola.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO**:
    -   W pliku `backend/src/service-types/dto/update-service-type.dto.ts` stwórz klasę `UpdateServiceTypeDto` z odpowiednimi dekoratorami `class-validator` (`@IsOptional`, `@IsString`, `@IsNotEmpty`, `@Length`).
2.  **Aktualizacja kontrolera (`ServiceTypesController`)**:
    -   W pliku `backend/src/service-types/service-types.controller.ts` dodaj nową metodę dla `PATCH /:id`.
    -   Zabezpiecz metodę dekoratorami `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles('ADMIN')`.
    -   Użyj dekoratora `@Patch(':id')` i dodaj `ApiOkResponse` oraz inne odpowiednie `ApiResponse` ze `@nestjs/swagger`.
    -   Wstrzyknij parametr `id` z użyciem `@Param('id', ParseUUIDPipe)` oraz ciało żądania z `@Body()`.
    -   Wywołaj metodę `update` z serwisu.
3.  **Implementacja logiki w serwisie (`ServiceTypesService`)**:
    -   W pliku `backend/src/service-types/service-types.service.ts` dodaj publiczną, asynchroniczną metodę `update(id: string, dto: UpdateServiceTypeDto)`.
    -   Wewnątrz metody, najpierw znajdź istniejący typ usługi za pomocą `findOne(id)`. Jeśli zasób nie istnieje, rzuć `NotFoundException`.
    -   Zaktualizuj właściwości znalezionego obiektu danymi z `dto`.
    -   Zapisz zmiany w bazie danych używając repozytorium Prisma.
    -   Zwróć zaktualizowany obiekt.

4.  **Aktualizacja dokumentacji Swagger**:
    -   Upewnij się, że wszystkie dekoratory `@nestjs/swagger` (`@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiParam`) są poprawnie dodane do metody w kontrolerze, aby dokumentacja API była aktualna i czytelna.
