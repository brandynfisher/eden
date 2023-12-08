import { expect, test } from '@playwright/test'

test('homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')
})
