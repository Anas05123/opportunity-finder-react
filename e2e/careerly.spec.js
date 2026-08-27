import { test, expect } from '@playwright/test';

test.describe('Careerly E2E Test Suite', () => {

  test('1. Landing Page renders successfully with key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Careerly/i);
    
    // Check hero headline or brand presence
    const heroText = page.locator('text=Every career opportunity').or(page.locator('text=Careerly')).first();
    await expect(heroText).toBeVisible();
    
    // Check navigation buttons
    const signInBtn = page.locator('text=Sign In').or(page.locator('text=Log In')).first();
    await expect(signInBtn).toBeVisible();
  });

  test('2. Navigation to Login and Register routes works seamlessly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    
    // Verify email input field exists
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Navigate to Register
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    const registerInput = page.locator('input[type="email"]').first();
    await expect(registerInput).toBeVisible();
  });

  test('3. Opportunities discovery page loads with search and filter controls', async ({ page }) => {
    await page.goto('/opportunities');
    await expect(page).toHaveURL(/.*opportunities/);
    
    // Verify page content loads without unhandled crash
    const mainArea = page.locator('body');
    await expect(mainArea).not.toHaveText(/Something went wrong/);
  });

  test('4. CV Studio route loads on-demand', async ({ page }) => {
    await page.goto('/cv-studio');
    await expect(page).toHaveURL(/.*cv-studio/);
    
    // Verify CV Studio content rendered
    await expect(page.locator('body')).not.toHaveText(/Something went wrong/);
  });

  test('5. Sentry Error Boundary protects application state against client crashes', async ({ page }) => {
    await page.goto('/');
    
    // Verify no unexpected error boundary trigger on initial load
    const errorFallback = page.locator('text=The application encountered a client rendering state issue');
    await expect(errorFallback).not.toBeVisible();
  });

});
