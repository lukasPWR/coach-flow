# API Endpoint Implementation Plan: PATCH /trainer-profiles/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do aktualizacji istniejącego profilu trenera na podstawie jego unikalnego identyfikatora (ID). Umożliwia częściową modyfikację danych, co oznacza, że klient musi wysłać tylko te pola, które chce zmienić. Dostęp do tego zasobu jest ograniczony i wymaga uprawnień na poziomie administratora.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/trainer-profiles/:id`
- **Parametry**:
  - **Wymagane**:
    - `id: string` (parametr ścieżki) - Identyfikator UUID profilu trenera, który ma zostać zaktualizowany.
- **Request Body**:
  - Obiekt JSON zgodny ze strukturą `UpdateTrainerProfileDto`. Wszystkie pola są opcjonalne.
  ```json
  {
    "description": "Nowy, zaktualizowany opis trenera.",
    "city": "Nowe Miasto",
    "profilePictureUrl": "https://example.com/new-photo.jpg",
    "specializationIds": ["uuid-specjalizacji-1", "uuid-specjalizacji-2"]
  }
  ```

## 3. Wykorzystywane typy

- **DTO**: `UpdateTrainerProfileDto` (`backend/src/trainer-profiles/dto/update-trainer-profile.dto.ts`) - Definiuje strukturę i zasady walidacji dla danych wejściowych w ciele żądania.
- **Entity**: `TrainerProfile` (`backend/src/trainer-profiles/entities/trainer-profile.entity.ts`) - Encja TypeORM reprezentująca tabelę `trainer_profiles` w bazie danych.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - Zwraca pełny, zaktualizowany obiekt profilu trenera w formacie JSON, zgodny z encją `TrainerProfile`.
  ```json
  {
    "id": "a1b2c3d4-...",
    "userId": "e5f6g7h8-...",
    "description": "Nowy, zaktualizowany opis trenera.",
    "city": "Nowe Miasto",
    "profilePictureUrl": "https://example.com/new-photo.jpg",
    "createdAt": "2025-11-16T10:00:00.000Z",
    "updatedAt": "2025-11-16T12:30:00.000Z",
    "specializations": [
      { "id": "uuid-specjalizacji-1", "name": "Trening siłowy" },
      { "id": "uuid-specjalizacji-2", "name": "Dietetyka" }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. `id` nie jest UUID, `city` nie jest stringiem).
  - `401 Unauthorized`: Brak lub nieprawidłowy token JWT.
  - `403 Forbidden`: Użytkownik nie ma roli `ADMIN`.
  - `404 Not Found`: Profil trenera o podanym `id` nie istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do kontrolera `TrainerProfilesController` na metodę obsługującą ścieżkę `/:id`.
2.  **Ochrona (Guards)**:
    - `JwtAuthGuard` weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`.
    - `RolesGuard` sprawdza, czy rola użytkownika w payloadzie JWT to `ADMIN`. Jeśli nie, zwraca `403 Forbidden`.
3.  **Walidacja (Pipes)**:
    - `ParseUUIDPipe` jest stosowany do parametru `:id`. Jeśli `id` nie jest prawidłowym UUID, zwraca `400 Bad Request`.
    - Globalny `ValidationPipe` waliduje ciało żądania względem `UpdateTrainerProfileDto`. W przypadku niezgodności zwraca `400 Bad Request`.
4.  Kontroler wywołuje metodę `trainerProfilesService.update(id, updateTrainerProfileDto)`.
5.  **Logika serwisowa (`TrainerProfilesService`)**:
    - Serwis używa repozytorium TypeORM, aby znaleźć profil trenera (`findOneOrFail`) wraz z jego powiązanymi specjalizacjami. Jeśli profil nie zostanie znaleziony, repozytorium rzuci wyjątek, który zostanie przechwycony i zmapowany na `404 Not Found`.
    - Jeśli w DTO przekazano `specializationIds`, serwis pobierze odpowiednie encje specjalizacji.
    - Serwis mapuje dane z DTO na znalezioną encję profilu.
    - Metoda `save` repozytorium zapisuje zaktualizowaną encję w bazie danych. Transakcja zapewni atomowość operacji (zwłaszcza przy aktualizacji relacji).
    - Serwis zwraca zaktualizowaną encję do kontrolera.
6.  Kontroler zwraca otrzymaną encję jako odpowiedź z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi zawierać prawidłowy nagłówek `Authorization: Bearer <token>`.
- **Autoryzacja**: Dostęp jest ściśle ograniczony do użytkowników z rolą `ADMIN`. Należy zaimplementować `RolesGuard` i użyć dekoratora `@Roles('ADMIN')`.
- **Walidacja danych wejściowych**: Stosowanie `ParseUUIDPipe` dla `id` oraz `ValidationPipe` z opcjami `whitelist` i `forbidNonWhitelisted` dla DTO jest obowiązkowe, aby chronić przed nieoczekiwanymi danymi i atakami typu Mass Assignment.
- **Ochrona przed SQL Injection**: Użycie TypeORM jako ORM zapewnia ochronę przed atakami SQL Injection, ponieważ parametryzuje zapytania.

## 7. Rozważania dotyczące wydajności

- **Zapytania do bazy danych**: Operacja wymaga co najmniej jednego zapytania `SELECT` w celu znalezienia profilu i jednego `UPDATE` w celu jego zapisania. Jeśli aktualizowane są specjalizacje, może to wymagać dodatkowych zapytań do tabeli łączącej. Należy zoptymalizować te operacje, np. poprzez użycie transakcji.
- **Pobieranie relacji**: Należy upewnić się, że relacje (np. ze specjalizacjami) są ładowane efektywnie (eager/lazy loading lub `relations` w `findOne`).

## 8. Etapy wdrożenia

1.  **Kontroler (`trainer-profiles.controller.ts`)**:

    - Zdefiniować metodę `update` z dekoratorem `@Patch(':id')`.
    - Zabezpieczyć metodę za pomocą `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles('ADMIN')`.
    - Użyć dekoratorów `@Param('id', ParseUUIDPipe)` i `@Body()` do przyjęcia i walidacji danych.
    - Dodać dokumentację Swagger (`@ApiOperation`, `@ApiResponse`).

2.  **Serwis (`trainer-profiles.service.ts`)**:

    - Zaimplementować publiczną metodę `async update(id: string, dto: UpdateTrainerProfileDto): Promise<TrainerProfile>`.
    - Wstrzyknąć repozytorium `TrainerProfile` (`@InjectRepository(TrainerProfile)`).
    - Dodać logikę wyszukiwania profilu (`findOneOrFail`).
    - Dodać logikę aktualizacji pól encji na podstawie DTO.
    - Zaimplementować obsługę aktualizacji relacji `specializations`, jeśli `specializationIds` jest obecne w DTO.
    - Zapisać zmiany w bazie danych za pomocą `repository.save()`.
    - Dodać obsługę błędów (np. `NotFoundException`).

3.  **DTO (`update-trainer-profile.dto.ts`)**:

    - Upewnić się, że plik istnieje i zawiera wszystkie opcjonalne pola z odpowiednimi dekoratorami `class-validator` i `class-transformer` (`@IsOptional`, `@IsString`, `@IsUrl`, `@IsArray`, `@IsUUID`).

4.  **Testy**:
    - **Testy jednostkowe (serwis)**: Sprawdzić, czy metoda `update` poprawnie aktualizuje dane, obsługuje relacje i rzuca `NotFoundException`, gdy profil nie istnieje.
    - **Testy E2E (kontroler)**: Utworzyć testy sprawdzające cały przepływ:
      - Pomyślna aktualizacja z kodem `200 OK`.
      - Próba dostępu bez tokenu (`401`).
      - Próba dostępu z rolą inną niż `ADMIN` (`403`).
      - Próba aktualizacji z nieprawidłowym UUID (`400`).
      - Próba aktualizacji nieistniejącego profilu (`404`).
      - Próba wysłania nieprawidłowych danych w ciele żądania (`400`).
