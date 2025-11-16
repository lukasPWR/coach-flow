# API Endpoint Implementation Plan: DELETE /trainer-profiles/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest przeznaczony do usuwania profilu trenera. Operacja wymaga uwierzytelnienia i odpowiednich uprawnień. Użytkownik musi być albo właścicielem profilu, albo administratorem, aby móc go usunąć. Po pomyślnym usunięciu serwer zwraca status `204 No Content`. Zgodnie ze schematem bazy danych, operacja ta jest trwałym usunięciem (hard delete).

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/trainer-profiles/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki, UUID): Unikalny identyfikator profilu trenera do usunięcia.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.
- **Nagłówki**:
  - `Authorization: Bearer <jwt_token>` (wymagany do uwierzytelnienia).

## 3. Wykorzystywane typy

- **Param DTO**: `TrainerProfileIdParamDto`

  - **Cel**: Walidacja parametru `id` ze ścieżki URL.
  - **Struktura**:

    ```typescript
    import { IsUUID } from 'class-validator'

    export class TrainerProfileIdParamDto {
      @IsUUID('4')
      id: string
    }
    ```

- **Encja**: `TrainerProfile` (z `backend/src/trainer-profiles/entities/trainer-profile.entity.ts`)
- **Interfejs użytkownika z JWT**: `User` (z `backend/src/users/interfaces/user.interface.ts`)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Ciało odpowiedzi**: Brak.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `id` w URL nie jest poprawnym UUID.
  - `401 Unauthorized`: Jeśli żądanie nie zawiera prawidłowego tokena uwierzytelniającego.
  - `403 Forbidden`: Jeśli uwierzytelniony użytkownik nie jest właścicielem profilu ani administratorem.
  - `404 Not Found`: Jeśli profil trenera o podanym `id` nie istnieje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera.

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia do `TrainerProfilesController`.
2.  Uruchamiany jest `AuthGuard('jwt')`, który weryfikuje token JWT i dołącza obiekt `user` do żądania.
3.  `ValidationPipe` używa `TrainerProfileIdParamDto` do walidacji parametru `:id`. Jeśli jest nieprawidłowy, zwraca `400 Bad Request`.
4.  Kontroler wywołuje metodę `remove(id, user)` w `TrainerProfilesService`, przekazując `id` z URL i obiekt `user` z `AuthGuard`.
5.  Serwis wyszukuje profil trenera w bazie danych za pomocą `TypeORM Repository`.
6.  Jeśli profil nie zostanie znaleziony, serwis rzuca `NotFoundException`, co skutkuje odpowiedzią `404 Not Found`.
7.  Serwis sprawdza uprawnienia: `user.role === 'ADMIN' || user.id === foundProfile.userId`. Jeśli warunek nie jest spełniony, rzuca `ForbiddenException`, co skutkuje odpowiedzią `403 Forbidden`.
8.  Jeśli uprawnienia są poprawne, serwis wywołuje metodę `repository.delete(id)` w celu trwałego usunięcia rekordu z tabeli `trainer_profiles`.
9.  Baza danych (PostgreSQL) dzięki ograniczeniu `ON DELETE CASCADE` automatycznie usuwa powiązane wpisy w tabeli `trainer_specializations`.
10. Po pomyślnym usunięciu, kontroler zwraca odpowiedź ze statusem `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony za pomocą `AuthGuard('jwt')`. Każde żądanie musi zawierać ważny token JWT w nagłówku `Authorization`.
- **Autoryzacja**: Należy zaimplementować logikę sprawdzania uprawnień na poziomie zasobu. Dostęp do usunięcia profilu powinien mieć tylko jego właściciel (użytkownik, którego `id` jest zapisane w `user_id` profilu) lub użytkownik z rolą `ADMIN`.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności

- Operacja usunięcia pojedynczego rekordu na podstawie klucza głównego jest bardzo wydajna i nie powinna stanowić wąskiego gardła.
- Kaskadowe usuwanie w tabeli `trainer_specializations` również jest wydajne, ponieważ opiera się na indeksowanych kluczach obcych.
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO do walidacji parametru**:

    - W pliku `backend/src/trainer-profiles/dto/trainer-profile-id-param.dto.ts` zdefiniować klasę `TrainerProfileIdParamDto` z polem `id` i dekoratorem `@IsUUID('4')`.

2.  **Aktualizacja `TrainerProfilesController`**:

    - Dodać nową metodę obsługującą `DELETE /:id`.
    - Zabezpieczyć metodę za pomocą `@UseGuards(AuthGuard('jwt'))`.
    - Użyć `@Param()` z `ValidationPipe` i `TrainerProfileIdParamDto` do pobrania i walidacji `id`.
    - Wstrzyknąć obiekt `user` z żądania za pomocą własnego dekoratora `@GetUser()` lub standardowego `@Req()`.
    - Ustawić kod odpowiedzi HTTP na `204` za pomocą dekoratora `@HttpCode(204)`.
    - Wywołać metodę `trainerProfilesService.remove(id, user)`.

    ```typescript
    // W pliku backend/src/trainer-profiles/trainer-profiles.controller.ts
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
      @Param() { id }: TrainerProfileIdParamDto,
      @GetUser() user: User, // Zakładając istnienie dekoratora GetUser
    ) {
      return this.trainerProfilesService.remove(id, user);
    }
    ```

3.  **Implementacja logiki w `TrainerProfilesService`**:

    - Dodać nową metodę `async remove(id: string, user: User): Promise<void>`.
    - Wstrzyknąć repozytorium `TrainerProfile` (`@InjectRepository(TrainerProfile)`).
    - Zaimplementować logikę opisaną w sekcji "Przepływ danych":
      a. Wyszukanie profilu za pomocą `findOneBy({ id })`.
      b. Rzucenie `NotFoundException`, jeśli profil nie istnieje.
      c. Sprawdzenie uprawnień (rola `ADMIN` lub własność profilu).
      d. Rzucenie `ForbiddenException`, jeśli brak uprawnień.
      e. Wywołanie `this.trainerProfileRepository.delete(id)`.

4.  **Testy**:
    - **Testy jednostkowe (Unit Tests)** dla `TrainerProfilesService`:
      - Sprawdzić, czy metoda `remove` poprawnie usuwa profil, gdy użytkownik jest właścicielem.
      - Sprawdzić, czy metoda `remove` poprawnie usuwa profil, gdy użytkownik jest adminem.
      - Sprawdzić, czy rzucany jest `ForbiddenException`, gdy użytkownik nie ma uprawnień.
      - Sprawdzić, czy rzucany jest `NotFoundException`, gdy profil nie istnieje.
    - **Testy E2E (End-to-End)**:
      - Zasymulować żądanie `DELETE` z poprawnymi danymi i tokenem właściciela, oczekując odpowiedzi `204`.
      - Zasymulować żądanie z tokenem innego użytkownika, oczekując `403`.
      - Zasymulować żądanie bez tokena, oczekując `401`.
      - Zasymulować żądanie z nieistniejącym UUID, oczekując `404`.
      - Zasymulować żądanie z niepoprawnym formatem ID, oczekując `400`.
