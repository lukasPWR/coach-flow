# E2E Tests with Playwright

This directory contains end-to-end tests for the CoachFlow application using Playwright.

## Structure

```
e2e/
├── pages/          # Page Object Models (POM)
├── fixtures/       # Test fixtures and data
├── utils/          # Helper utilities
└── *.spec.ts       # Test files
```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate tests using codegen
npm run test:e2e:codegen
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code here
  });
});
```

### Using Page Object Model

Create a page object in `pages/` directory:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  private readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /click me/i });
  }

  async clickMyButton() {
    await this.myButton.click();
  }
}
```

## Best Practices

1. **Use Page Object Model** - Encapsulate page interactions in page objects
2. **Use Semantic Locators** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
3. **Wait for Elements** - Use built-in waiting mechanisms instead of fixed timeouts
4. **Isolate Tests** - Each test should be independent and not rely on other tests
5. **Use Fixtures** - Create reusable fixtures for common setup
6. **Visual Testing** - Use screenshots for visual regression testing
7. **Parallel Execution** - Tests run in parallel by default for speed

## Configuration

See `playwright.config.ts` in the root directory for configuration options.

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Sequential execution
- Trace collection on failure
- Screenshot and video capture on failure
