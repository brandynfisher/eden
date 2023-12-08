import { expect, test } from '@playwright/test'

test('navigate to /concepts feed', async ({ page }) => {
  await page.goto('/concepts')

  await expect(page).toHaveURL('/concepts')

  await page.click('text=Latest')

  await expect(page).toHaveURL('/concepts')

  await page.waitForSelector('[role="gridcell"]')
})
