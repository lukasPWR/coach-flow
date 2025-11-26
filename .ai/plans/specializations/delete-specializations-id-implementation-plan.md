# API Endpoint Implementation Plan: DELETE /specializations/:id

## 1. Przegląd punktu końcowego

Endpoint DELETE /specializations/:id umożliwia usunięcie istniejącej specjalizacji z bazy danych. Jest to operacja administracyjna dostępna wyłącznie dla użytkowników z rolą ADMIN, służąca zarządzaniu słownikiem specjalizacji. Specjalizacje są współdzielone między profilami trenerów (relacja N:M via tabela trainer_specializations), dlatego przed usunięciem należy zweryfikować brak powiązań lub obsłużyć kaskadowe usunięcie. Operacja zwraca 204 No Content w przypadku sukcesu, bez ciała odpowiedzi. Zgodne z architekturą NestJS, TypeORM i PostgreSQL, z użyciem soft delete jeśli zaimplementowane, lub hard delete z walidacją.

## 2. Szczegóły żądania

- Metoda HTTP: DELETE
- Struktura URL: `/api/v1/specializations/:id` (zakładając wersjonowanie URI zgodnie z rules)
- Parametry:
  - Wymagane: `id` (string, UUID v4 specjalizacji, walidowane jako @Param z UUID validation)
  - Opcjonalne: Brak
- Request Body: Brak (empty body dla DELETE)

## 3. Wykorzystywane typy

- **DTOs/Command Modele:** Brak dedykowanego DTO dla request (brak body). Użyć prostego parametru `id: string` w controller. Wewnętrznie, service może używać `SpecializationInterface` do pobierania encji przed usunięciem.
- **Interfejsy:** `SpecializationInterface` (z generated-types: { id: string, name: string }) do typowania encji w service.
- **Enums:** Brak specyficznych dla tego endpointu; użyć `UserRole` (ADMIN) do guard.
- **Swagger:** Użyć @ApiOperation, @ApiParam({ name: 'id', type: String }) i @ApiNoContentResponse dla dokumentacji.

## 4. Szczegóły odpowiedzi

- Oczekiwana struktura odpowiedzi: Brak ciała (204 No Content).
- Kody statusu:
  - 204 No Content: Sukces, specjalizacja usunięta.
  - 400 Bad Request: Nieprawidłowy format ID (np. nie UUID).
  - 401 Unauthorized: Brak uwierzytelnienia lub invalid JWT.
  - 403 Forbidden: Użytkownik nie ma roli ADMIN.
  - 404 Not Found: Specjalizacja o podanym ID nie istnieje lub już usunięta (soft delete).
  - 500 Internal Server Error: Błąd serwera (np. problem z DB, foreign key constraint).

## 5. Przepływ danych

1. Controller odbiera request z parametrem `id` i user context z JWT (via @Req() lub guard).
2. Walidacja: Global ValidationPipe sprawdza `id` jako UUID; RolesGuard weryfikuje rolę ADMIN.
3. Service (SpecializationsService):
   - Pobiera encję Specialization po `id` via TypeORM repository (findOne, z exclude deleted if soft delete).
   - Sprawdza powiązania: Query do trainer_specializations, aby upewnić się, że brak aktywnych relacji (jeśli tak, rzuć ForbiddenException z komunikatem o zależnościach).
   - Wykonuje delete: Użyj repository.delete({ id }) dla hard delete, lub softDelete dla updated_at/deleted_at.
4. Jeśli sukces, controller zwraca res.status(204).send().
5. Interakcja z DB: Jedno zapytanie findOne + jedno delete; transakcja jeśli potrzeba (np. kaskadowe czyszczenie trainer_specializations).

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Wymagane JWT token via AuthGuard('jwt').
- Autoryzacja: RolesGuard sprawdzający rolę 'ADMIN' (zdefiniować w auth module, używając @Roles('ADMIN') decorator).
- Walidacja danych: @IsUUID('4') dla `id` w custom param pipe lub via ValidationPipe. Brak body, więc brak parsing issues.
- Ochrona przed atakami: Helmet dla headers, CORS z explicit origins. Walidacja zapobiega SQL injection (TypeORM params). Loguj próby nieautoryzowanego dostępu.
- Dodatkowe: Sprawdź czy specjalizacja nie jest używana w aktywnych profilach trenerów, aby uniknąć usunięcia współdzielonych danych.

## 7. Obsługa błędów

- 400 Bad Request: Invalid UUID w `id` – rzuć BadRequestException w controller pipe.
- 401 Unauthorized: Brak/nieprawidłowy token – obsługiwane przez AuthGuard.
- 403 Forbidden: Nie ADMIN lub specjalizacja w użyciu – rzuć ForbiddenException w service.
- 404 Not Found: Encja nie istnieje – rzuć NotFoundException po findOne w service.
- 500 Internal Server Error: Błędy DB (np. constraint violation) – catch w service, loguj via Logger, rzuć InternalServerErrorException.
- Global: HttpExceptionFilter do formatowania response (z message, status). Logi z context (userId, endpoint, error stack).

## 8. Rozważania dotyczące wydajności

- Potencjalne wąskie gardła: Query do trainer_specializations dla sprawdzenia powiązań (indeks na specialization_id w DB-plan). Dla dużych danych, użyj count() zamiast find() jeśli tylko check existence.
- Strategie optymalizacji: Użyj transakcji DB dla atomicity (jeśli kaskada). Cache specializations jeśli często odczytywane, ale dla DELETE invalidate cache. Ogranicz do <1s execution via indexes na id. Monitoruj via middleware metrics.

## 9. Etapy wdrożenia

1. Zaktualizuj SpecializationsController: Dodaj @Delete(':id') metodę z @Param('id') id: string, @UseGuards(AuthGuard, RolesGuard), wstrzyknij service.
2. W SpecializationsService: Dodaj async deleteSpecialization(id: string, requestingUserId: string): Promise<void> – findOne, check relations via injected TrainerSpecializationsRepository, delete/softDelete, handle exceptions.
3. Dodaj walidację: Custom ParamPipe dla UUID lub użyć @IsUUID w DTO jeśli wrap w object.
4. Swagger: Dodaj @ApiOperation, @ApiResponse dla kodów statusu.
5. Testy: Unit test service (mock repository, expect exceptions), e2e test endpoint (z mock auth, sprawdź 204, 403, 404).
6. DB: Upewnij się o index na specializations.id; jeśli hard delete, rozważ trigger na kaskadę lub manual clean w trainer_specializations.
7. Logi i monitoring: Dodaj Logger w service dla delete actions.
8. Integracja: Uruchom migracje jeśli potrzeba (brak zmian schematu), przetestuj z frontendem lub Postman.
