Jesteś ekspertem w dziedzinie backendu, specjalizującym się w ekosystemie NestJS i konfiguracji baz danych z użyciem TypeORM. Twoim zadaniem jest stworzenie kompletnego, gotowego do użycia modułu bazodanowego wraz z konfiguracją Docker na podstawie dostarczonych informacji.

**Cel:** Automatyzacja początkowej konfiguracji bazy danych, ORM, migracji i środowiska deweloperskiego Docker.

**Dane wejściowe:**
Oczekuję, że otrzymasz następujące dane:

1.  `DATABASE_TYPE`: Rodzaj bazy danych (np. `PostgreSQL`, `MSSQL`, `MySQL`).
2.  `ORM_TYPE`: Rodzaj ORM (na ten moment skup się na `TypeORM`).
3.  `ENV_FILE_CONTENT`: Zawartość pliku `.env` z danymi dostępowymi do bazy danych, w formacie JSON:
    ```json
    {
      "DATABASE": "NazwaBazyDanych_DEV",
      "HOST": "localhost",
      "PASSWORD": "TwojeSilneHaslo!",
      "PORT": "PORT_BAZY_DANYCH",
      "USERNAME": "uzytkownik"
    }
    ```

**WAŻNE - Konwencje nazewnictwa:**

- Wszystkie zmienne środowiskowe używane w Docker i backend MUSZĄ mieć prefix `DB_` (np. `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`, `DB_HOST`, `DB_DATABASE`)
- To jest KRYTYCZNE na systemach Windows, gdzie zmienne jak `USERNAME`, `PASSWORD`, `PORT` są już zajęte przez system
- W `ENV_FILE_CONTENT` użytkownik może podać nazwy bez prefixu - TY musisz je przekonwertować

**Kroki do wykonania:**

Postępuj zgodnie z poniższymi instrukcjami, aby stworzyć spójną i skalowalną konfigurację.

**Krok 1: Analiza i przygotowanie**

1.  Przeanalizuj `DATABASE_TYPE` i `ENV_FILE_CONTENT`, aby zidentyfikować niezbędne pakiety i parametry konfiguracyjne.

**Krok 2: Instalacja zależności**
Zainstaluj wymagane pakiety jeśli ich brakuje. Poniżej przykłady dla różnych baz danych:

- **Dla MSSQL:**
  ```bash
  npm install @nestjs/typeorm typeorm mssql @nestjs/config typeorm-transactional
  ```
- **Dla PostgreSQL:**
  ```bash
  npm install @nestjs/typeorm typeorm pg @nestjs/config typeorm-transactional
  ```
- **Dla MySQL:**
  ```bash
  npm install @nestjs/typeorm typeorm mysql2 @nestjs/config typeorm-transactional
  ```

**UWAGA:** Pakiet `dotenv` jest wymagany do wczytywania zmiennych środowiskowych w `data-source.ts`.

**Krok 3: Konfiguracja modułu NestJS**

1.  Utwórz moduł `database`.
2.  W folderze `backend/src/database` utwórz plik `database.module.ts` z następującą konfiguracją:
    - Użyj `TypeOrmModule.forRootAsync` z `ConfigModule` i `ConfigService`
    - Wszystkie zmienne środowiskowe MUSZĄ używać prefixu `DB_`: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
    - Ustaw `autoLoadEntities: true`
    - Ustaw `synchronize: false` (zawsze używamy migracji)
    - Włącz `logging` w trybie development
    - Ścieżka migracji: `migrations: ['dist/database/migrations/*{.js,.ts}']`
3.  W pliku `backend/src/app.module.ts`:
    - Zaimportuj `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`
    - Zaimportuj `DatabaseModule`
4.  W pliku `backend/src/main.ts`:
    - Na samym początku (przed `bootstrap()`): `import { initializeTransactionalContext } from 'typeorm-transactional';`
    - Następnie: `initializeTransactionalContext();`
    - Dopiero potem funkcja `bootstrap()`

**Krok 4: Konfiguracja TypeORM CLI (Data Source)**

1.  Utwórz folder `src/database/migrations`.
2.  W folderze `src/database` utwórz plik `data-source.ts`. Skonfiguruj `DataSource` tak, aby wczytywał konfigurację z pliku `.env`. Użyj ścieżek glob do automatycznego wykrywania encji (np. `entities: ['dist/**/*.entity.js']`) i migracji (np. `migrations: ['dist/database/migrations/*{.js,.ts}']`).

**Krok 5: Konfiguracja Docker**

1.  **Struktura folderów:** Utwórz `backend/docker/postgres` (lub `mssql`, `mysql` w zależności od typu bazy)
2.  **Plik init.sql:** W folderze `backend/docker/postgres` stwórz `init.sql`:
    - PostgreSQL: `CREATE DATABASE "NazwaBazyDanych_DEV";` (bez `GO`)
    - MSSQL: `CREATE DATABASE [NazwaBazyDanych_DEV]; GO`
    - MySQL: `CREATE DATABASE IF NOT EXISTS NazwaBazyDanych_DEV;`
3.  **Plik .env:** W folderze `backend/docker/postgres` stwórz `.env` (NIE `.env.dev`!) z następującymi zmiennymi (ZAWSZE z prefixem `DB_`):
    ```
    DATABASE=NazwaBazyDanych_DEV
    DB_HOST=localhost
    DB_PASSWORD=TwojeHaslo
    DB_PORT=5432
    DB_USERNAME=postgres
    ```
    **WAŻNE:** Użyj `cmd /c "echo ... > .env"` na Windows aby utworzyć plik.
4.  **Plik backend/.env:** Utwórz również `backend/.env` dla aplikacji NestJS z tymi samymi zmiennymi (z prefixem `DB_`):
    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=TwojeHaslo
    DB_DATABASE=NazwaBazyDanych_DEV
    NODE_ENV=development
    PORT=3000
    ```
5.  **docker-compose.yml:** W głównym katalogu projektu (`coachflow/`) stwórz `docker-compose.yml`:
    - **NIE używaj** atrybutu `version` (jest przestarzały w Docker Compose v2+)
    - **KRYTYCZNE:** Użyj zmiennych z prefixem `DB_` w environment:
      - `POSTGRES_USER: ${DB_USERNAME:-postgres}`
      - `POSTGRES_PASSWORD: ${DB_PASSWORD:-haslo}`
      - `POSTGRES_DB: postgres`
    - Port mapping: `"${DB_PORT:-5432}:5432"`
    - Healthcheck: `test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]`
    - Volume dla init: `- ./backend/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql`
    - env_file: `- ./backend/docker/postgres/.env`
    - Dodaj serwis `configurator` z `depends_on: postgres: condition: service_healthy`

**PRZYKŁAD docker-compose.yml dla PostgreSQL:**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nazwa-projektu-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-haslo}
      POSTGRES_DB: postgres
    ports:
      - '${DB_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME:-postgres}']
      interval: 10s
      timeout: 5s
      retries: 5
    env_file:
      - ./backend/docker/postgres/.env
    networks:
      - app-network

  configurator:
    image: postgres:16-alpine
    container_name: nazwa-projektu-postgres-configurator
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PGPASSWORD: ${DB_PASSWORD:-haslo}
    command: >
      sh -c "
        echo 'PostgreSQL is ready. Database initialization complete.';
      "
    env_file:
      - ./backend/docker/postgres/.env
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

**Krok 6: Dodanie skryptów NPM**
W pliku `backend/package.json` dodaj skrypty ułatwiające pracę z migracjami:

```json
"scripts": {
  // ... inne skrypty
  "typeorm": "npm run build && npx typeorm -d dist/database/data-source.js",
  "migration:generate": "npm run typeorm -- migration:generate",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert"
}
```

**Krok 7: Weryfikacja i testowanie**

1.  **Uruchom Docker Compose:**
    ```bash
    cmd /c "cd .. && docker compose up -d"
    ```
2.  **Sprawdź czy baza została utworzona:**
    ```bash
    docker exec nazwa-kontenera-postgres psql -U postgres -l
    ```
3.  **Przetestuj połączenie:**
    ```bash
    docker exec nazwa-kontenera-postgres psql -U postgres -d NazwaBazy -c "SELECT 1 as test;"
    ```

**Krok 8: Dokumentacja**

Utwórz plik `.ai/db-setup.md` z:

- Opisem struktury projektu
- Listą utworzonych plików
- Instrukcją uruchomienia
- Przykładami użycia skryptów migracji
- Uwagą o używaniu prefixu `DB_` dla zmiennych środowiskowych

---

## Podsumowanie - Lista kontrolna

Po wykonaniu wszystkich kroków, upewnij się że:

✅ Wszystkie pliki `.env` używają prefixu `DB_` dla zmiennych bazodanowych  
✅ `docker-compose.yml` NIE zawiera atrybutu `version`  
✅ Dla PostgreSQL użytkownik to `postgres`, NIE `sa`  
✅ Ścieżki w `docker-compose.yml` wskazują na `./backend/docker/postgres/`  
✅ Pakiet `dotenv` jest zainstalowany  
✅ `data-source.ts` importuje `join` z `path` i używa poprawnej ścieżki do `.env`  
✅ Docker Compose uruchamia się bez błędów  
✅ Baza danych została utworzona i jest dostępna

Po wykonaniu przedstaw użytkownikowi:

1. Listę utworzonych i zmodyfikowanych plików
2. Podsumowanie konfiguracji (typ bazy, nazwa, port, użytkownik)
3. Instrukcje uruchomienia (jak uruchomić Docker, jak wygenerować migrację, jak uruchomić aplikację)
