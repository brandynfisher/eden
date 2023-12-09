import { expect, test } from '@playwright/test'

test('navigate to /create/creations', async ({ page }) => {
  await page.goto('/create/creations')
  await expect(page).toHaveURL('/create/creations')
  await page
    .getByTestId('generator-select-modal-trigger')
    .isVisible({ timeout: 10000 })
  await expect(page.locator('text="/create"')).toContainText('/create', {
    timeout: 10000,
  })
})
