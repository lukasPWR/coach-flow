Jesteś specjalistą GitHub Actions (DevOps Engineer) w stacku opisanym w @.ai/config/tech-stack.md
Mój projekt to struktura typu "Monorepo" (bez narzędzi typu Nx/Lerna) z podziałem na katalogi: @backend (NestJS) oraz @frontend

Twoim zadaniem jest utworzenie konfiguracji CI, która skupia się wyłącznie na jakości kodu (Lint) i testach jednostkowych (Unit), pomijając testy E2E.

Utwórz dwa osobne pliki workflow, aby zoptymalizować czas wykonywania (Path Filtering):

1. `.github/workflows/ci-backend.yml`
2. `.github/workflows/ci-frontend.yml`

Wymagania dla każdego Workflow:

### Ogólne zasady (zgodnie z @.cursor/rules/github-action.mdc

- Używaj `paths` w sekcji `on: pull_request`, aby workflow uruchamiał się TYLKO gdy zmienią się pliki w danym katalogu (np. `backend/**`) lub pliki konfiguracyjne.
- Ustawiaj `defaults.run.working-directory` na odpowiedni podkatalog (`./backend` lub `./frontend`), aby komendy npm działały poprawnie.
- Używaj `npm ci` do instalacji zależności (pamiętaj o cache'owaniu w kontekście podkatalogu).

### Specyfika Backend (`ci-backend.yml`):

- Stack: NestJS, Jest.
- Krok 1: Lintowanie (ESLint).
- Krok 2: Testy jednostkowe (Jest). Upewnij się, że nie wymagają one połączenia z bazą danych (jeśli wymagają, dodaj serwis postgres, ale domyślnie załóż, że to czyste unity).

### Specyfika Frontend (`ci-frontend.yml`):

- Stack: Vue 3, Vite, TypeScript.
- Krok 1: Type Check (KRYTYCZNE: uruchom `vue-tsc --noEmit` aby sprawdzić typy, czego Vite nie robi przy buildzie dev).
- Krok 2: Lintowanie (ESLint).
- Krok 3: Testy jednostkowe (Vitest/Jest).

### Co usunąć względem standardowego procesu:

- NIE twórz jobów dla testów E2E (Playwright).
- NIE twórz mechanizmu `status-comment`.
- NIE pobieraj przeglądarek ani kontenerów, chyba że są niezbędne do unit testów backendu.

Zastosuj się do zasad z @.cursor/rules/github-action.mdc , szczególnie w kwestii weryfikacji wersji akcji (`actions/checkout`, `actions/setup-node`).
