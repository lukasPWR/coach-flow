# CoachFlow

![alt text](image.png)

Platform for managing coaching sessions.

## 🚀 Szybki Start (Docker)

To najprostszy sposób na uruchomienie całej aplikacji (Frontend + Backend + Baza Danych) za pomocą jednej komendy.

1.  **Skopiuj plik konfiguracyjny i wygeneruj klucze JWT:**

    ```bash
    cp .env.example .env
    ```

    _(W systemie Windows użyj: `copy .env.example .env`)_

    Następnie edytuj plik `.env` i **wygeneruj własne klucze JWT**:

    ```env
    JWT_ACCESS_SECRET=wygeneruj_bezpieczny_klucz_64_znaki
    JWT_REFRESH_SECRET=wygeneruj_inny_bezpieczny_klucz_64_znaki
    ```

    > 💡 Użyj generatora: [https://jwtsecretkeygenerator.com](https://jwtsecretkeygenerator.com) lub zobacz sekcję [Environment Variables](#environment-variables)

2.  **Uruchom aplikację:**

    ```bash
    docker-compose up --build
    ```

    Poczekaj chwilę, aż kontenery się zbudują, a baza danych zainicjalizuje. Migracje uruchomią się automatycznie.

3.  **Gotowe! Otwórz w przeglądarce:**
    - **Aplikacja:** [http://localhost](http://localhost)
    - API bezpośrednio: [http://localhost/api](http://localhost/api) (proxy do backendu)

### 🔐 Konta Demo

Po uruchomieniu aplikacji możesz zalogować się na jedno z poniższych kont testowych:

| Rola   | Email               | Hasło      |
| ------ | ------------------- | ---------- |
| Admin  | admin@coachflow.pl  | Admin123!  |
| Trener | trener@coachflow.pl | Trener123! |
| Klient | klient@coachflow.pl | Klient123! |

---

## 🛠️ Uruchomienie Lokalne (bez Dockera)

Jeśli preferujesz uruchomić aplikację lokalnie bez Dockera, postępuj zgodnie z poniższymi krokami.

### Wymagania

- Node.js 18+
- PostgreSQL 14+ (zainstalowany lokalnie lub jako kontener Docker)
- npm

### Krok 1: Baza danych PostgreSQL

#### Opcja A: PostgreSQL jako kontener Docker (zalecane)

Uruchom tylko bazę danych w kontenerze:

```bash
docker run -d \
  --name coachflow-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1StrongPwd! \
  -e POSTGRES_DB=CoachFlow_DEV \
  -p 5432:5432 \
  postgres:16-alpine
```

_(W systemie Windows użyj PowerShell lub zamień `\` na `` ` ``)_

#### Opcja B: Lokalna instalacja PostgreSQL

1. Zainstaluj PostgreSQL 14+ na swoim systemie
2. Utwórz bazę danych:
   ```sql
   CREATE DATABASE "CoachFlow_DEV";
   ```

### Krok 2: Konfiguracja środowiska

```bash
# Skopiuj plik konfiguracyjny
cp .env.example .env
```

Dla uruchomienia lokalnego upewnij się, że plik `.env` zawiera:

```env
DB_HOST=localhost
DB_DATABASE=CoachFlow_DEV
```

> 💡 Pozostałe zmienne możesz zostawić z wartościami domyślnymi. Szczegóły w sekcji [Environment Variables](#environment-variables).

### Krok 3: Instalacja zależności

```bash
# Z głównego katalogu projektu
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Krok 4: Migracje i seed bazy danych

```bash
cd backend

# Uruchom migracje
npm run migration:run

# Załaduj dane początkowe (użytkownicy demo, typy usług, ćwiczenia, itp.)
npm run seed
```

### Krok 5: Uruchomienie aplikacji

Otwórz **dwa terminale**:

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Krok 6: Gotowe!

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **Swagger API Docs:** [http://localhost:3000/api](http://localhost:3000/api)

Zaloguj się używając [kont demo](#-konta-demo) utworzonych podczas seedowania.

---

## Tech Stack

### Frontend

- **Framework**: Vue.js 3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn-vue
- **Build Tool**: Vite
- **State Management**: Pinia
- **Testing**: Vitest + Testing Library

### Backend

- **Framework**: NestJS
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Testing**: Jest + Supertest

### E2E Testing

- **Framework**: Playwright
- **Browser**: Chromium

---

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

### Quick Start

```bash
# Run all tests
npm run test:all

# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# E2E tests (from root)
npm run test:e2e
```

## Project Structure

```
coachflow/
├── backend/           # NestJS backend application
│   ├── src/          # Source code
│   ├── test/         # E2E tests
│   └── package.json
├── frontend/         # Vue.js frontend application
│   ├── src/         # Source code
│   └── package.json
├── e2e/             # Playwright E2E tests
│   ├── pages/       # Page Object Models
│   ├── fixtures/    # Test fixtures
│   └── utils/       # Helper utilities
├── .ai/             # AI configuration
├── .cursor/         # Cursor IDE rules
└── package.json     # Root workspace configuration
```

## Environment Variables

**Ważne:** Cały projekt używa jednego wspólnego pliku `.env` w głównym katalogu projektu.

### Konfiguracja

1. Skopiuj plik przykładowy:

   ```bash
   cp .env.example .env
   ```

   _(W systemie Windows użyj: `copy .env.example .env`)_

2. **Wygeneruj bezpieczne klucze JWT** (wymagane dla środowiska produkcyjnego):

   Możesz użyć generatora online: [https://jwtsecretkeygenerator.com](https://jwtsecretkeygenerator.com) lub wygenerować lokalnie:

   ```bash
   # Linux/macOS
   openssl rand -base64 64

   # PowerShell (Windows)
   [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
   ```

   Wygeneruj **dwa różne** klucze - jeden dla `JWT_ACCESS_SECRET`, drugi dla `JWT_REFRESH_SECRET`.

### Zmienne środowiskowe

| Zmienna                       | Opis                            | Wartość domyślna                             |
| ----------------------------- | ------------------------------- | -------------------------------------------- |
| `DB_HOST`                     | Host bazy danych                | `localhost` (lokalnie) / `postgres` (Docker) |
| `DB_PORT`                     | Port PostgreSQL                 | `5432`                                       |
| `DB_USERNAME`                 | Użytkownik bazy danych          | `postgres`                                   |
| `DB_PASSWORD`                 | Hasło do bazy danych            | `1StrongPwd!`                                |
| `DB_DATABASE`                 | Nazwa bazy danych               | `CoachFlow_DEV`                              |
| `NODE_ENV`                    | Środowisko Node.js              | `development`                                |
| `PORT`                        | Port backendu                   | `3000`                                       |
| `BCRYPT_SALT_ROUNDS`          | Rundy hashowania bcrypt         | `12`                                         |
| `JWT_ACCESS_SECRET`           | 🔐 Klucz do tokenów dostępu     | **Wygeneruj własny!**                        |
| `JWT_REFRESH_SECRET`          | 🔐 Klucz do tokenów odświeżania | **Wygeneruj własny!**                        |
| `JWT_ACCESS_EXPIRATION_TIME`  | Czas życia tokenu dostępu       | `30m`                                        |
| `JWT_REFRESH_EXPIRATION_TIME` | Czas życia tokenu odświeżania   | `7d`                                         |
| `VITE_API_URL`                | URL API dla frontendu           | `http://localhost:3000/api`                  |

> ⚠️ **Uwaga:** Dla środowiska produkcyjnego **zawsze** zmień domyślne hasła i wygeneruj własne klucze JWT!

---

## Scripts

### Backend

```bash
npm run start:dev         # Uruchom w trybie development
npm run build             # Zbuduj do produkcji
npm run start:prod        # Uruchom serwer produkcyjny
npm run migration:run     # Uruchom migracje bazy danych
npm run seed              # Załaduj dane początkowe
npm test                  # Uruchom testy jednostkowe
npm run test:cov          # Testy z pokryciem kodu
npm run lint              # Sprawdź kod lintera
```

### Frontend

```bash
npm run dev               # Uruchom serwer developerski
npm run build             # Zbuduj do produkcji
npm run preview           # Podgląd buildu produkcyjnego
npm test                  # Uruchom testy jednostkowe
npm run test:coverage     # Testy z pokryciem kodu
npm run lint              # Sprawdź kod lintera
```

---

## Documentation

- [API Documentation](http://localhost:3000/api) - Swagger API docs (when backend is running)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

UNLICENSED - Private project
