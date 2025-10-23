# Wymagania startowe dla projektu CoachFlow

## 🛠️ Wymagane narzędzia systemowe

### 1. Node.js

- **Wersja**: v22.14.0 (zgodnie z `.nvmrc`)
- **Instalacja**:
  - Bezpośrednio z [nodejs.org](https://nodejs.org/)
  - LUB przez NVM (Node Version Manager) - **zalecane**
    - Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)
    - macOS/Linux: [nvm](https://github.com/nvm-sh/nvm)
- **Weryfikacja**: `node --version` (powinno pokazać v22.14.0)

### 2. npm

- **Wersja**: Najnowsza (instalowana automatycznie z Node.js)
- **Weryfikacja**: `npm --version`
- **Alternatywy**: pnpm lub yarn (opcjonalnie, dla lepszej wydajności)

### 3. Git

- **Wersja**: Najnowsza stabilna
- **Instalacja**: [git-scm.com](https://git-scm.com/)
- **Weryfikacja**: `git --version`

### 4. PostgreSQL

> **Zalecane podejście**: Uruchomienie przez **Docker Compose** (bez instalacji lokalnej)

- **Wersja**: 16.x (obraz Docker)
- **Instalacja**: NIE POTRZEBNA - użyjemy Docker Compose
- **Uruchomienie**: Zostanie skonfigurowane w `docker-compose.yml`

**Dlaczego Docker zamiast lokalnej instalacji?**

- ✅ Brak potrzeby instalacji i konfiguracji PostgreSQL na systemie
- ✅ Łatwe zarządzanie (start/stop jednym poleceniem)
- ✅ Izolacja od innych projektów
- ✅ Łatwe czyszczenie danych testowych
- ✅ Identyczne środowisko dla całego zespołu

### 5. Docker Compose

- **Status**: ✅ Już zainstalowany
- **Weryfikacja**: `docker compose version`
- **Zastosowanie**: Lokalne uruchomienie bazy danych PostgreSQL

---

## 📦 Globalne paczki npm (opcjonalnie)

Te paczki mogą być zainstalowane globalnie dla wygody, ale mogą też być używane lokalnie przez npx:

```bash
# NestJS CLI (dla generowania kodu backendu)
npm install -g @nestjs/cli

# Prisma CLI (dla zarządzania bazą danych)
npm install -g prisma

# TypeScript (dla globalnego użycia tsc)
npm install -g typescript

# Vite (opcjonalnie, dla globalnego dostępu)
npm install -g vite
```

**Uwaga**: Większość z tych narzędzi można używać przez `npx` bez globalnej instalacji.

---

## 🎨 Narzędzia do jakości kodu

### ESLint

- **Przeznaczenie**: Linting kodu JavaScript/TypeScript
- **Instalacja**: Będzie zainstalowany lokalnie w projekcie (zarówno w frontend jak i backend)
- **Konfiguracja**: Osobne pliki `.eslintrc.js` dla frontendu i backendu

### Prettier

- **Przeznaczenie**: Automatyczne formatowanie kodu
- **Instalacja**: Będzie zainstalowany lokalnie w projekcie (w rocie)
- **Konfiguracja**: Wspólny plik `.prettierrc` w rocie projektu

---

## 🚀 Framework i biblioteki - Frontend

### Automatycznie zainstalowane przez Vite + Vue:

- **Vue.js 3** (najnowsza wersja 3.x)
- **TypeScript 5** (najnowsza wersja 5.x)
- **Vite** (najnowsza wersja)

### Dodatkowo do zainstalowania:

- **Tailwind CSS 4**: Framework CSS (z PostCSS)
- **shadcn-vue**: Biblioteka komponentów UI
- **Vue Router**: Do routingu (jeśli potrzebne)
- **Pinia**: State management (jeśli potrzebne)
- **Axios / Fetch API**: Do komunikacji z backendem

### Dodatkowe narzędzia deweloperskie:

- **@vitejs/plugin-vue**: Plugin Vite dla Vue
- **autoprefixer**: PostCSS plugin dla kompatybilności CSS
- **tailwindcss**: CSS framework

---

## ⚙️ Framework i biblioteki - Backend

### Automatycznie zainstalowane przez NestJS CLI:

- **NestJS** (najnowsza wersja)
- **TypeScript 5**
- **RxJS**: Do reaktywnego programowania
- **Reflect-metadata**: Do dekoratorów TypeScript

### Dodatkowo do zainstalowania:

- **Prisma**: ORM dla PostgreSQL
  - `@prisma/client`: Klient Prisma
  - `prisma`: CLI i narzędzia deweloperskie
- **@nestjs/config**: Do zarządzania konfiguracją (zmienne środowiskowe)
- **@nestjs/jwt** i **@nestjs/passport**: Do autoryzacji
- **bcrypt**: Do hashowania haseł
- **class-validator** i **class-transformer**: Do walidacji DTO
- ~~**axios**: Do komunikacji z OpenRouter.ai~~ (nie potrzebne na start)

---

## 🤖 Integracja AI - OpenRouter.ai

> **Status**: ⏸️ **NIE POTRZEBNE NA START**  
> Integracja z OpenRouter.ai zostanie dodana w późniejszych fazach projektu, gdy podstawowa funkcjonalność będzie już działać.

<details>
<summary>📋 Szczegóły (do wykorzystania w przyszłości)</summary>

### Wymagania:

- **Klucz API OpenRouter**: Zarejestruj się na [openrouter.ai](https://openrouter.ai/)
- **Axios lub Fetch**: Do wykonywania requestów HTTP do API
- **Konfiguracja**: Klucz API będzie przechowywany w zmiennych środowiskowych (`.env`)

### Planowane modele:

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)

</details>

---

## 🔧 IDE i rozszerzenia (zalecane)

### Visual Studio Code (lub Cursor)

**Zalecane rozszerzenia**:

- **Vue - Official** (Vue Language Features)
- **TypeScript Vue Plugin (Volar)**
- **Tailwind CSS IntelliSense**
- **Prisma** (Prisma syntax highlighting)
- **ESLint**
- **Prettier - Code formatter**
- **GitLens** (opcjonalnie)
- **Docker** (jeśli używasz Dockera)

---

## 📋 Lista kontrolna przed rozpoczęciem

- [ ] Node.js v22.14.0 zainstalowany i zweryfikowany
- [ ] npm/pnpm zainstalowany i działający
- [ ] Git zainstalowany i skonfigurowany
- [ ] Docker Compose dostępny i działający
- [ ] IDE (VS Code/Cursor) zainstalowany z zalecanymi rozszerzeniami
- [ ] (Opcjonalnie) NestJS CLI zainstalowany globalnie

---

## 🚀 Następne kroki po instalacji narzędzi

1. **Inicjalizacja struktury projektu**: Stworzenie folderów `frontend/` i `backend/`
2. **Setup Frontend**: `npm create vite@latest frontend -- --template vue-ts`
3. **Setup Backend**: `nest new backend`
4. **Konfiguracja Tailwind CSS**: W projekcie frontend
5. **Instalacja shadcn-vue**: W projekcie frontend
6. **Setup Prisma**: W projekcie backend
7. **Konfiguracja ESLint i Prettier**: W rocie projektu
8. **Konfiguracja zmiennych środowiskowych**: Pliki `.env` dla frontend i backend
9. **Setup Docker Compose**: Dla lokalnego developmentu (PostgreSQL + aplikacje)
10. **Inicjalizacja Git**: `.gitignore`, pierwszy commit

---

## 📝 Notatki dodatkowe

### Zarządzanie wersjami Node.js

Jeśli używasz NVM, stwórz plik `.nvmrc` w rocie projektu:

```
22.14.0
```

Następnie: `nvm use` automatycznie przełączy się na właściwą wersję.

### Docker Compose dla developmentu

Przykładowy `docker-compose.yml` może zawierać:

- PostgreSQL (port 5432)
- Backend NestJS (port 3000)
- Frontend Vite (port 5173)
- Opcjonalnie: pgAdmin dla zarządzania bazą danych

### Zmienne środowiskowe

Przykładowe pliki `.env` na start:

- **Backend**: `DATABASE_URL`, `JWT_SECRET`
- **Frontend**: `VITE_API_URL`

> **Uwaga**: `OPENROUTER_API_KEY` zostanie dodany w późniejszych fazach projektu

---

_Dokument stworzony: 2025-10-23_
_Tech Stack: Vue.js 3 + TypeScript + Tailwind CSS + shadcn-vue + Vite | NestJS + PostgreSQL + Prisma_
