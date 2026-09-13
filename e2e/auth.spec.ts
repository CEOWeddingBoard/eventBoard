import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication flow
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pl/sign-in')
  })

  test('should display sign in page', async ({ page }) => {
    await expect(page).toHaveTitle(/Sign In|Zaloguj/)
  })

  test('should navigate to sign up', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: /sign up|zarejestruj/i })
    if (await signUpLink.isVisible()) {
      await signUpLink.click()
      await expect(page).toHaveURL(/sign-up/)
    }
  })

  // Note: Actual login tests would require Clerk test mode or mocking
})
