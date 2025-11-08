# API Endpoint Implementation Plan: POST /service-types

## 1. Przegląd punktu końcowego

Punkt końcowy `POST /service-types` służy do tworzenia nowego typu usługi w systemie. Jest to operacja administracyjna, przeznaczona do zarządzania słownikiem dostępnych typów usług, które mogą być później przypisywane do konkretnych usług oferowanych przez trenerów. Dostęp do tego endpointu jest ograniczony wyłącznie dla użytkowników z rolą `ADMIN`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/service-types`
- **Nagłówki**:
  - `Authorization: Bearer <JWT_TOKEN>` (wymagane)
- **Request Body**:
  - Struktura: `application/json`
  - Schemat:
  ```json
  {
    "name": "string"
  }
  ```

## 3. Wykorzystywane typy

- **DTO**:

  - `CreateServiceTypeDto`

    ```typescript
    import { IsNotEmpty, IsString } from 'class-validator'

    export class CreateServiceTypeDto {
      @IsString()
      @IsNotEmpty()
      name: string
    }
    ```

- **Entity**:

  - `ServiceType` (zgodnie z definicją TypeORM)

    ```typescript
    import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

    @Entity({ name: 'service_types' })
    export class ServiceType {
      @PrimaryGeneratedColumn('uuid')
      id: string

      @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
      name: string
    }
    ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`201 Created`)**:

  - Opis: Zwraca nowo utworzony obiekt typu usługi.
  - Struktura:

  ```json
  {
    "id": "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
    "name": "Trening personalny"
  }
  ```

- **Odpowiedzi błędu**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. brak `name`).
  - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
  - `403 Forbidden`: Użytkownik nie posiada uprawnień `ADMIN`.
  - `409 Conflict`: Typ usługi o podanej nazwie już istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `POST` z tokenem JWT i ciałem zawierającym `name` trafia do `ServiceTypesController`.
2.  `JwtAuthGuard` weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401`.
3.  `RolesGuard` sprawdza, czy użytkownik w tokenie ma rolę `ADMIN`. Jeśli nie, zwraca `403`.
4.  Globalny `ValidationPipe` waliduje `CreateServiceTypeDto`. Jeśli dane są nieprawidłowe, zwraca `400`.
5.  Kontroler wywołuje metodę `create()` w `ServiceTypesService`, przekazując zwalidowane DTO.
6.  `ServiceTypesService` sprawdza w bazie danych, czy typ usługi o podanej nazwie już istnieje.
    - Jeśli tak, rzuca `ConflictException` (co skutkuje odpowiedzią `409`).
    - Jeśli nie, tworzy nową instancję encji `ServiceType`.
7.  Serwis używa repozytorium TypeORM do zapisania nowej encji w tabeli `service_types`.
8.  Serwis zwraca zapisaną encję do kontrolera.
9.  Kontroler zwraca nowo utworzony obiekt z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Żądania bez ważnego tokena Bearer JWT będą odrzucane z kodem `401`.
- **Autoryzacja**: Dostęp musi być ograniczony do roli `ADMIN`. Należy użyć dekoratorów `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles(UserRole.ADMIN)` na metodzie kontrolera.
- **Walidacja danych**: Użycie `ValidationPipe` z opcjami `whitelist: true` i `forbidNonWhitelisted: true` w konfiguracji globalnej aplikacji zapewnia, że tylko oczekiwane pole `name` zostanie przetworzone, a wszelkie inne pola zostaną odrzucone. Zapobiega to atakom typu Mass Assignment.
- **Ochrona nagłówków**: Aplikacja powinna używać biblioteki `helmet` do ustawiania bezpiecznych nagłówków HTTP.

## 7. Obsługa błędów

| Kod Statusu | Sytuacja                                                   | Sposób obsługi                                                                                                                                                              |
| ----------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`       | `name` jest puste, nie jest stringiem lub go brakuje.      | Automatycznie obsługiwane przez `ValidationPipe` na podstawie DTO.                                                                                                          |
| `401`       | Brak lub nieprawidłowy token JWT.                          | Automatycznie obsługiwane przez `JwtAuthGuard`.                                                                                                                             |
| `403`       | Użytkownik nie ma roli `ADMIN`.                            | Automatycznie obsługiwane przez `RolesGuard`.                                                                                                                               |
| `409`       | Typ usługi o podanej nazwie już istnieje.                  | `ServiceTypesService` powinien wykonać zapytanie `findOneBy({ name })`. Jeśli znajdzie rekord, rzuca `new ConflictException('Service type with this name already exists')`. |
| `500`       | Problem z połączeniem z bazą danych lub inny błąd serwera. | Obsługiwane przez globalny `HttpExceptionFilter`. Błąd powinien być logowany za pomocą `Logger.error()`.                                                                    |

## 8. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych**: Operacja wymaga jednego zapytania `SELECT` w celu sprawdzenia unikalności nazwy oraz jednego zapytania `INSERT` w celu utworzenia rekordu.
- **Indeksy**: Kolumna `name` w tabeli `service_types` musi mieć unikalny indeks (`UNIQUE`), co zapewni szybkie wyszukiwanie i zapobiegnie duplikatom na poziomie bazy danych.
- **Skalowalność**: Ze względu na charakter operacji (rzadkie wywołania administracyjne), endpoint nie stanowi wąskiego gardła wydajnościowego.

## 9. Etapy wdrożenia

1.  **Moduł**: Upewnić się, że istnieje moduł `ServiceTypesModule` (`service-types.module.ts`) i jest on zaimportowany w głównym `AppModule`.
2.  **Encja**: Zdefiniować encję `ServiceType` w `backend/src/service-types/entities/service-type.entity.ts` zgodnie z punktem 3.
3.  **DTO**: Utworzyć plik `backend/src/service-types/dto/create-service-type.dto.ts` z definicją `CreateServiceTypeDto`.
4.  **Serwis**:
    - Utworzyć/zaktualizować `ServiceTypesService` w `backend/src/service-types/service-types.service.ts`.
    - Wstrzyknąć repozytorium `Repository<ServiceType>` do serwisu.
    - Zaimplementować metodę `create(createServiceTypeDto: CreateServiceTypeDto)` zawierającą logikę sprawdzania unikalności i zapisu.
5.  **Kontroler**:
    - Utworzyć/zaktualizować `ServiceTypesController` w `backend/src/service-types/service-types.controller.ts`.
    - Zdefiniować metodę dla `POST /service-types` z dekoratorem `@Post()`.
    - Zabezpieczyć metodę za pomocą `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles(UserRole.ADMIN)`.
    - Użyć `@Body()` do przyjęcia `CreateServiceTypeDto`.
    - Wywołać metodę `create()` z serwisu i zwrócić wynik.
    - Dodać adnotacje `@Api...` z `@nestjs/swagger` w celu udokumentowania endpointu.
