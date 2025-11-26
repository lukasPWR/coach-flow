# API Endpoint Implementation Plan: GET /specializations

## 1. Przegląd punktu końcowego

Endpoint GET /specializations służy do pobierania listy wszystkich dostępnych specjalizacji w systemie CoachFlow. Jest to zasób słownikowy, dostępny publicznie, zwracający podstawowe informacje o specjalizacjach (ID i nazwa). Celem jest zapewnienie klientom i trenerom dostępu do katalogu specjalizacji bez konieczności uwierzytelniania, co ułatwia integrację z frontendem i innymi modułami aplikacji.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/specializations`
- Parametry:
  - Wymagane: Brak
  - Opcjonalne: Brak (w przyszłości rozważyć paginację, np. ?page=1&limit=10, ale nie w tej implementacji)
- Request Body: Brak (nie dotyczy dla GET)

## 3. Wykorzystywane typy

- **DTOs i Command Modele:**
  - `SpecializationDto` (nowy lub oparty na istniejącym interfejsie): Reprezentuje odpowiedź z polami `id: string` (UUID) i `name: string`. Użyj `@ApiProperty()` dla Swagger. Walidacja niepotrzebna dla outputu, ale typuj explicitnie.
  - Brak input DTO/Command Models, gdyż operacja nie wymaga danych wejściowych.
  - Oparty na istniejącym `specialization.interface.ts`: `{ id: string; name: string }`.
  - W service: Użyj `SpecializationEntity` z TypeORM dla zapytań.

## 4. Szczegóły odpowiedzi

- Oczekiwana struktura odpowiedzi (200 OK):
  ```json
  [
    {
      "id": "uuid-string-1",
      "name": "Utrata wagi"
    },
    {
      "id": "uuid-string-2",
      "name": "Trening siłowy"
    }
  ]
  ```
  - Jeśli brak specjalizacji: Pusta tablica `[]`.
- Kody statusu:
  - 200 OK: Sukces, lista specjalizacji.
- Nagłówki: Standardowe, np. `Content-Type: application/json`. Użyj `@nestjs/swagger` do automatycznej dokumentacji.

## 5. Przepływ danych

1. Klient wysyła GET /specializations.
2. Controller (`SpecializationsController`) odbiera request, nie wymaga walidacji inputu.
3. Controller wstrzykuje `SpecializationsService` i wywołuje `findAll()` (lub podobną metodę).
4. Service wstrzykuje `Repository<SpecializationEntity>` (TypeORM) i wykonuje query: `find({ where: { deletedAt: IsNull() } })` (jeśli soft delete, choć tabela nie ma deleted_at; dostosuj jeśli potrzeba).
5. Service mapuje encje na `SpecializationDto[]` (wyklucz wrażliwe pola, jeśli jakieś).
6. Controller zwraca `SpecializationDto[]` jako response.
7. Interakcja z DB: Proste SELECT z tabeli `specializations` via TypeORM. Brak zewnętrznych usług.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie: Nie wymagane (public endpoint), ale monitoruj użycie. Jeśli zmienione na chronione, dodaj `@UseGuards(JwtAuthGuard)`.
- Autoryzacja: Brak ról specyficznych; wszyscy mają dostęp do odczytu.
- Walidacja danych: Brak inputu, ale output sanitizuj nazwy (użyj escape jeśli HTML). Użyj global `ValidationPipe` dla spójności.
- Inne: Włącz rate limiting (@nestjs/throttler, np. 100 req/min na IP) przeciw DDoS. Konfiguruj CORS z explicit origins. Użyj helmet dla security headers. Brak PII w odpowiedzi.

## 7. Obsługa błędów

- Potencjalne błędy:
  - Błąd bazy danych (np. połączenie): 500 Internal Server Error, loguj via service/interceptor, zwróć `{ message: 'Internal server error' }`.
  - Brak danych: 200 z pustą tablicą (nie błąd).
  - Rate limit: 429 Too Many Requests (jeśli włączone).
  - Nieprawidłowa konfiguracja (np. brak repo): 500, obsłuż w module.
- Użyj global `HttpExceptionFilter` do standaryzacji. W service: try-catch async operacji, rzuć `InternalServerErrorException` z kontekstem. Loguj błędy z request ID (middleware).

## 8. Rozważania dotyczące wydajności

- Potencjalne wąskie gardła: Duża liczba specjalizacji (mało prawdopodobne, tabela słownikowa); query jest O(1) z indeksem na id.
- Strategie optymalizacji: Użyj cache (Redis via @nestjs/cache-manager) dla listy, invalidate na CREATE/UPDATE. Paginate jeśli lista rośnie (choć nie teraz). Indeks na `name` dla przyszłych wyszukiwań. Query tylko potrzebne pola (`select: ['id', 'name']` w TypeORM). Testuj z load testing (Artillery).

## 9. Etapy wdrożenia

1. Utwórz lub zweryfikuj `SpecializationEntity` w `src/specializations/entities/specialization.entity.ts` z TypeORM dekoratorami (@Entity, @PrimaryGeneratedColumn('uuid'), @Column({ unique: true })).
2. W `SpecializationsModule`: Eksportuj `TypeOrmModule.forFeature([Specialization])`, wstrzyknij repo do service.
3. W `SpecializationsService`: Dodaj metodę `async findAll(): Promise<SpecializationDto[]> { const entities = await this.repo.find(); return entities.map(e => ({ id: e.id, name: e.name })); }`. Obsłuż błędy.
4. W `SpecializationsController`: Dodaj `@Get()` z `@ApiOperation({ summary: 'Get all specializations' })`, zwróć `this.service.findAll()`. Użyj `@ApiResponse({ status: 200, type: [SpecializationDto] })`.
5. Utwórz `SpecializationDto` w `dto/specialization.dto.ts` z `@ApiProperty()` i typami.
6. Włącz rate limiting w module lub globalnie (ThrottlerModule).
7. Dodaj unit test dla service (findAll zwraca tablicę) i e2e test dla endpointu (supertest, expect 200 i strukturę).
8. Uruchom migrację DB jeśli potrzeba (dla tabeli specializations), seed dane testowe.
9. Dokumentuj w Swagger, przetestuj endpoint.
