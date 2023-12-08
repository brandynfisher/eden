import { expect, test } from '@playwright/test'

test('navigate to /create/concepts', async ({ page }) => {
  await page.goto('/create/concepts')
  await expect(page).toHaveURL('/create/concepts')
  await page
    .getByTestId('generator-select-modal-trigger')
    .isVisible({ timeout: 10000 })
  await expect(page.locator('text="/concept-trainer"')).toContainText(
    '/concept-trainer',
    { timeout: 10000 },
  )
})
