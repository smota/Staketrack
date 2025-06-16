// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Configuration Functional Tests', () => {
  test('should display the correct environment name in the footer', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/')

    // The environment display should be visible in development mode
    const environmentDisplay = page.locator('[data-testid="environment-display"]')
    await expect(environmentDisplay).toBeVisible()

    // It should contain the correct environment name
    await expect(environmentDisplay).toHaveText(' | Env: DEV')
  })
})
