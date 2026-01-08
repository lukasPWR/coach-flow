import { test, expect } from '@playwright/test';

test.describe('Example E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loaded successfully
    await expect(page).toHaveTitle(/CoachFlow/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click the login button/link
    const loginButton = page.getByRole('link', { name: /zaloguj|login/i });
    await loginButton.click();
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form elements
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /zaloguj|login/i })).toBeVisible();
  });
});
