# Testing Guide for CoachFlow

This document provides comprehensive guidelines for testing in the CoachFlow project.

## Table of Contents

1. [Overview](#overview)
2. [Backend Testing (Jest)](#backend-testing-jest)
3. [Frontend Testing (Vitest)](#frontend-testing-vitest)
4. [E2E Testing (Playwright)](#e2e-testing-playwright)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

## Overview

CoachFlow uses a comprehensive testing strategy:

- **Unit Tests**: Jest (Backend) and Vitest (Frontend)
- **Integration Tests**: Jest with Supertest (Backend)
- **E2E Tests**: Playwright (Full application)

### Test Coverage Goals

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Backend Testing (Jest)

### Configuration

Backend tests use Jest with TypeScript support. Configuration is in `backend/jest.config.ts`.

### Running Backend Tests

```bash
cd backend

# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Writing Unit Tests

Create test files with `.spec.ts` extension next to the source files.

**Example: Service Test**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should perform operation', async () => {
    const result = await service.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Writing E2E Tests

E2E tests for backend are in `backend/test/` directory with `.e2e-spec.ts` extension.

**Example: Controller E2E Test**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/endpoint')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
      });
  });
});
```

### Best Practices for Backend Tests

1. **Use Dependency Injection**: Leverage NestJS DI for easy mocking
2. **Mock External Dependencies**: Mock database, HTTP calls, etc.
3. **Test Business Logic**: Focus on service layer testing
4. **Use Supertest for HTTP**: Test controllers with Supertest
5. **Setup and Teardown**: Clean up resources in afterEach/afterAll
6. **Use describe blocks**: Organize related tests together

## Frontend Testing (Vitest)

### Configuration

Frontend tests use Vitest with Vue Test Utils. Configuration is in `frontend/vitest.config.ts`.

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Writing Component Tests

Create test files with `.spec.ts` extension next to component files.

**Example: Component Test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title',
      },
    });

    expect(wrapper.text()).toContain('Test Title');
  });

  it('handles user interaction', async () => {
    const wrapper = mount(MyComponent);
    const button = wrapper.find('button');
    
    await button.trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('clicked');
  });
});
```

### Testing with Pinia Stores

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { useMyStore } from '@/stores/myStore';

describe('Component with Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('uses store correctly', () => {
    const store = useMyStore();
    const wrapper = mount(MyComponent);
    
    // Test component with store
  });
});
```

### Best Practices for Frontend Tests

1. **Test User Behavior**: Focus on what users see and do
2. **Use Testing Library Queries**: Prefer semantic queries
3. **Mock External Dependencies**: Mock API calls, router, etc.
4. **Test Accessibility**: Ensure components are accessible
5. **Avoid Implementation Details**: Test behavior, not implementation
6. **Use Fixtures**: Create reusable test data

## E2E Testing (Playwright)

### Configuration

E2E tests use Playwright with Chromium. Configuration is in `playwright.config.ts`.

### Running E2E Tests

```bash
# From root directory

# Run all e2e tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate tests with codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

E2E tests are in the `e2e/` directory with `.spec.ts` extension.

**Example: E2E Test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete user journey', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    
    // Interact with elements
    await page.getByRole('button', { name: /login/i }).click();
    
    // Assert results
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

### Using Page Object Model

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
```

### Best Practices for E2E Tests

1. **Use Page Object Model**: Encapsulate page interactions
2. **Use Semantic Locators**: Prefer role-based selectors
3. **Wait for Navigation**: Use built-in waiting mechanisms
4. **Isolate Tests**: Each test should be independent
5. **Use Fixtures**: Create reusable setup code
6. **Visual Testing**: Use screenshots for visual regression
7. **Test Critical Paths**: Focus on main user journeys

## Running Tests

### Run All Tests

```bash
# From root directory
npm run test:all
```

This will run:
1. Backend unit tests
2. Frontend unit tests
3. E2E tests

### Watch Mode (Development)

```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm test
```

### Coverage Reports

```bash
# Backend coverage
cd backend && npm run test:cov

# Frontend coverage
cd frontend && npm run test:coverage
```

Coverage reports are generated in:
- Backend: `backend/coverage/`
- Frontend: `frontend/coverage/`

## Best Practices

### General Testing Principles

1. **Write Tests First (TDD)**: Consider writing tests before implementation
2. **Test Behavior, Not Implementation**: Focus on what, not how
3. **Keep Tests Simple**: One assertion per test when possible
4. **Use Descriptive Names**: Test names should describe what they test
5. **Arrange-Act-Assert**: Structure tests clearly
6. **DRY Principle**: Use helper functions and fixtures
7. **Isolate Tests**: Tests should not depend on each other
8. **Mock External Dependencies**: Control test environment

### Code Organization

```
backend/
├── src/
│   └── module/
│       ├── module.service.ts
│       ├── module.service.spec.ts      # Unit test
│       ├── module.controller.ts
│       └── module.controller.spec.ts   # Unit test
└── test/
    └── module.e2e-spec.ts              # E2E test

frontend/
├── src/
│   ├── components/
│   │   ├── MyComponent.vue
│   │   └── MyComponent.spec.ts         # Component test
│   └── stores/
│       ├── myStore.ts
│       └── myStore.spec.ts             # Store test

e2e/
├── pages/                              # Page objects
├── fixtures/                           # Test data
├── utils/                              # Helpers
└── *.spec.ts                           # E2E tests
```

### Naming Conventions

- Unit tests: `*.spec.ts`
- E2E tests: `*.e2e-spec.ts` (backend) or `*.spec.ts` (Playwright)
- Test suites: Use `describe('FeatureName', () => {})`
- Test cases: Use `it('should do something', () => {})`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:all"
    }
  }
}
```

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in test configuration
- Check for unresolved promises
- Ensure proper cleanup in afterEach/afterAll

**Flaky tests**
- Avoid fixed timeouts, use waitFor utilities
- Ensure proper test isolation
- Check for race conditions

**Coverage not meeting thresholds**
- Review uncovered code paths
- Add tests for edge cases
- Consider if thresholds are realistic

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
