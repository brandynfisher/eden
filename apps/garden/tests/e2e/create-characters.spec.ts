import { expect, test } from '@playwright/test'

test.skip('navigate to /create/characters', async ({ page }) => {
  await page.goto('/create/characters')
  await expect(page).toHaveURL('/create/characters')
  await expect(page.locator('text="Create new Character"')).toContainText(
    'Create new Character',
  )
})
