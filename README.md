# CoachFlow

Aplikacja internetowa (MVP) do usprawnienia interakcji pomiędzy trenerami personalnymi a ich klientami.

## 📋 Opis projektu

CoachFlow to platforma, która centralizuje kluczowe procesy w relacji trener-klient:

- Tworzenie i zarządzanie ofertą trenera
- Rezerwacja terminów sesji treningowych
- Wspólny kalendarz dla trenera i klienta
- System powiadomień e-mail
- Dedykowane dashboardy dla obu ról

## 🛠️ Tech Stack

### Frontend

- **Framework**: Vue.js 3
- **Język**: TypeScript 5
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Komponenty UI**: shadcn-vue (radix-vue)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios

### Backend

- **Framework**: NestJS
- **Język**: TypeScript 5
- **Baza danych**: PostgreSQL (do konfiguracji)
- **ORM**: Prisma (do konfiguracji)
- **Autoryzacja**: JWT, Passport, Bcrypt
- **Walidacja**: class-validator, class-transformer

### Narzędzia

- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (Docker)
- **Version Control**: Git
- **Node.js**: v22.14.0

## 📁 Struktura projektu

```
coachflow/
├── .ai/                    # Dokumentacja projektu
│   ├── prd.md             # Product Requirements Document
│   ├── tech-stack.md      # Szczegóły tech stacku
│   └── starter-requirements.md
├── backend/               # Backend NestJS
│   ├── src/
│   ├── test/
│   └── package.json
├── frontend/              # Frontend Vue.js
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
├── .nvmrc                 # Node.js v22.14.0
└── README.md
```

## 🚀 Rozpoczęcie pracy

### Wymagania

- Node.js v22.14.0 (użyj `nvm use` jeśli masz zainstalowany nvm)
- npm lub pnpm
- Docker & Docker Compose (dla bazy danych PostgreSQL)

### Instalacja

1. **Sklonuj repozytorium**

```bash
git clone <repository-url>
cd coachflow
```

2. **Użyj właściwej wersji Node.js**

```bash
nvm use
```

3. **Backend - Instalacja zależności**

```bash
cd backend
npm install
```

4. **Frontend - Instalacja zależności**

```bash
cd frontend
npm install
```

5. **Konfiguracja zmiennych środowiskowych**

Backend (`.env`):

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
# DATABASE_URL będzie dodane później
```

Frontend (`.env`):

```env
VITE_API_URL=http://localhost:3000
VITE_API_PREFIX=api
VITE_APP_ENV=development
```

### Uruchomienie aplikacji

**Backend** (port 3000):

```bash
cd backend
npm run start:dev
```

**Frontend** (port 5173):

```bash
cd frontend
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:5173

## 📝 Dostępne skrypty

### Backend

- `npm run start:dev` - uruchomienie w trybie development z hot-reload
- `npm run build` - build produkcyjny
- `npm run start:prod` - uruchomienie wersji produkcyjnej
- `npm run lint` - linting kodu
- `npm run format` - formatowanie kodu (Prettier)
- `npm run test` - uruchomienie testów

### Frontend

- `npm run dev` - uruchomienie dev servera (Vite)
- `npm run build` - build produkcyjny
- `npm run preview` - podgląd wersji produkcyjnej
- `npm run lint` - linting kodu
- `npm run format` - formatowanie kodu (Prettier)

## 🗄️ Baza danych (PostgreSQL)

> **Uwaga**: Konfiguracja Prisma i PostgreSQL zostanie dodana w późniejszych etapach projektu.

Planowane uruchomienie przez Docker Compose:

```bash
docker compose up -d
```

## 📚 Dokumentacja

Więcej informacji znajdziesz w folderze `.ai/`:

- **[PRD](.ai/prd.md)** - Pełny dokument wymagań produktu
- **[Tech Stack](.ai/tech-stack.md)** - Szczegółowy opis technologii
- **[Starter Requirements](.ai/starter-requirements.md)** - Wymagania do rozpoczęcia pracy

## 🎯 Status projektu

**Aktualny status**: 🟢 Inicjalizacja zakończona

### ✅ Zakończone

- [x] Inicjalizacja projektu backend (NestJS)
- [x] Inicjalizacja projektu frontend (Vue.js + Vite)
- [x] Instalacja wszystkich wymaganych zależności
- [x] Konfiguracja Tailwind CSS
- [x] Konfiguracja ESLint i Prettier
- [x] Setup podstawowy plików `.gitignore` i `.nvmrc`
- [x] Instalacja bibliotek: Vue Router, Pinia, Axios
- [x] Instalacja zależności dla shadcn-vue (radix-vue, etc.)

### ⏸️ Do zrobienia później

- [ ] Konfiguracja Prisma ORM
- [ ] Setup Docker Compose dla PostgreSQL
- [ ] Konfiguracja @nestjs/config z plikami .env
- [ ] Implementacja komponentów shadcn-vue
- [ ] Implementacja systemu autoryzacji (JWT)
- [ ] Implementacja modeli bazy danych
- [ ] Integracja z OpenRouter.ai (późniejsza faza)

## 👥 Zespół

CoachFlow MVP Development Team

## 📄 Licencja

UNLICENSED - Projekt prywatny

---

_Dokument stworzony: 2025-10-23_
