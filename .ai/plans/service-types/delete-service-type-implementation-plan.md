# API Endpoint Implementation Plan: DELETE /service-types/:id

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za trwałe usunięcie typu usługi (rekordu słownikowego) z systemu. Operacja jest restrykcyjna i dostępna wyłącznie dla użytkowników z uprawnieniami administratora. Usunięcie jest możliwe tylko wtedy, gdy dany typ usługi nie jest powiązany z żadną aktywną usługą oferowaną przez trenerów.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/service-types/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (w ścieżce): Unikalny identyfikator (UUID) typu usługi, który ma zostać usunięty.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **Param DTO**:
  - Zalecane jest użycie `ParseUUIDPipe` bezpośrednio w kontrolerze do walidacji formatu `id`. Nie ma potrzeby tworzenia dedykowanego DTO tylko dla tego parametru, co jest zgodne z istniejącym kodem w module.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Ciało odpowiedzi**: Brak.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowy format `id`.
  - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
  - `403 Forbidden`: Użytkownik nie posiada uprawnień administratora.
  - `404 Not Found`: Typ usługi o podanym `id` nie został znaleziony.
  - `409 Conflict`: Typ usługi jest używany i nie może zostać usunięty.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `DELETE` jest wysyłane na adres `/service-types/:id`.
2.  NestJS routing kieruje żądanie do metody `remove()` w `ServiceTypesController`.
3.  Uruchamiane są strażniki (Guards):
    - `JwtAuthGuard` weryfikuje token JWT.
    - `RolesGuard` sprawdza, czy użytkownik ma rolę `ADMIN`.
4.  `ParseUUIDPipe` waliduje format parametru `:id`.
5.  Kontroler wywołuje metodę `remove(id)` w `ServiceTypesService`.
6.  `ServiceTypesService`:
    a. Sprawdza, czy istnieją jakiekolwiek rekordy w tabeli `services` z `service_type_id` równym podanemu `id`.
    b. Jeśli tak, zgłasza `ConflictException`.
    c. Jeśli nie, próbuje usunąć rekord z tabeli `service_types`.
    d. Jeśli operacja usunięcia nie wpłynęła na żaden wiersz (co oznacza, że typ usługi nie istniał), zgłasza `NotFoundException`.
7.  Jeśli operacja w serwisie zakończy się sukcesem, kontroler zwraca odpowiedź z kodem `204 No Content`.
8.  W przypadku wyjątku, globalny filtr wyjątków przechwytuje go i formatuje odpowiedź błędu HTTP.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez `JwtAuthGuard`. Wszystkie żądania muszą zawierać prawidłowy token JWT w nagłówku `Authorization`.
- **Autoryzacja**: Dostęp musi być ograniczony wyłącznie do użytkowników z rolą `ADMIN`. Należy zastosować `RolesGuard` w połączeniu z dekoratorem `@Roles('ADMIN')`.
- **Walidacja danych wejściowych**: Parametr `id` musi być walidowany jako UUID, aby zapobiec potencjalnym atakom (np. SQL Injection, chociaż ORM zapewnia ochronę) i błędom przetwarzania.

## 7. Rozważania dotyczące wydajności

- Operacja usunięcia jest poprzedzona zapytaniem sprawdzającym istnienie powiązanych usług. Należy upewnić się, że kolumna `service_type_id` w tabeli `services` jest zaindeksowana, aby to zapytanie było wydajne. Zgodnie z `db-plan.md` (`idx_services_service_type_id`), indeks już istnieje.
- Operacja jest atomowa i prosta, więc nie przewiduje się znaczących wąskich gardeł wydajnościowych.

## 8. Etapy wdrożenia

1.  **Aktualizacja Serwisu (`ServiceTypesService`)**:

    - Dodaj nową metodę `async remove(id: string): Promise<void>`.
    - Wstrzyknij repozytorium dla encji `Service` (lub odpowiedni serwis).
    - Wewnątrz metody `remove`, zaimplementuj logikę sprawdzania, czy typ usługi jest używany. Jeśli tak, rzuć `ConflictException`.
    - Zaimplementuj logikę usuwania typu usługi. Użyj `delete` z TypeORM/Prisma, a następnie sprawdź liczbę usuniętych rekordów. Jeśli wynosi 0, rzuć `NotFoundException`.

2.  **Aktualizacja Kontrolera (`ServiceTypesController`)**:

    - Dodaj nową metodę `remove(@Param('id', ParseUUIDPipe) id: string)`.
    - Oznacz metodę dekoratorem `@Delete(':id')`.
    - Ustaw kod odpowiedzi sukcesu na `204` za pomocą dekoratora `@HttpCode(HttpStatus.NO_CONTENT)`.
    - Zabezpiecz metodę za pomocą dekoratorów `@UseGuards(JwtAuthGuard, RolesGuard)` i `@Roles('ADMIN')`. (Należy odkomentować importy i użycie, gdy moduł `auth` będzie gotowy).
    - Wywołaj metodę `this.serviceTypesService.remove(id)` w ciele metody kontrolera.

3.  **Dokumentacja API (Swagger)**:

    - Dodaj odpowiednie dekoratory Swagger (`@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiBearerAuth`) do nowej metody w kontrolerze, aby dokładnie opisać jej działanie, parametry, możliwe odpowiedzi i wymagania bezpieczeństwa.
