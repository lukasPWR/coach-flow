# CoachFlow

Platform for managing coaching sessions.

## 🚀 Szybki Start (Docker)

To najprostszy sposób na uruchomienie całej aplikacji (Frontend + Backend + Baza Danych) za pomocą jednej komendy.

1.  **Skopiuj plik konfiguracyjny:**

    ```bash
    cp .env.example .env
    ```

    _(W systemie Windows użyj: `copy .env.example .env`)_

2.  **Uruchom aplikację:**

    ```bash
    docker-compose up --build
    ```

    Poczekaj chwilę, aż kontenery się zbudują, a baza danych zainicjalizuje. Migracje uruchomią się automatycznie.

3.  **Gotowe! Otwórz w przeglądarce:**
    - **Aplikacja:** [http://localhost](http://localhost)
    - API bezpośrednio: [http://localhost/api](http://localhost/api) (proxy do backendu)

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

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd frontend && npm install
```

### Running the Application

```bash
# Start backend (from backend directory)
cd backend
npm run start:dev

# Start frontend (from frontend directory)
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Documentation: http://localhost:3000/api

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

## Development

### Code Style

- Use ESLint and Prettier for code formatting
- Follow conventional commits for commit messages
- Use TypeScript strict mode

### Conventional Commits

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

## Scripts

### Root Level

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests in UI mode
npm run test:e2e:headed   # Run E2E tests in headed mode
npm run test:e2e:debug    # Debug E2E tests
npm run test:e2e:report   # View E2E test report
npm run test:all          # Run all tests (backend + frontend + e2e)
```

### Backend

```bash
npm run start:dev         # Start in development mode
npm run build             # Build for production
npm run start:prod        # Start production server
npm test                  # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run backend E2E tests
npm run lint              # Lint code
npm run format            # Format code
```

### Frontend

```bash
npm run dev               # Start development server
npm run build             # Build for production
npm run preview           # Preview production build
npm test                  # Run unit tests
npm run test:ui           # Run tests in UI mode
npm run test:coverage     # Run tests with coverage
npm run lint              # Lint code
npm run format            # Format code
```

## Environment Variables

### Backend

Create `.env` file in `backend/` directory:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/coachflow
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

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
