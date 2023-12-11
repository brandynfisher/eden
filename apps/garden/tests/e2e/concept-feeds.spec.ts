import { expect, test } from '@playwright/test'

test('navigate to /concepts feed', async ({ page }) => {
  await page.goto('/concepts')

  await expect(page).toHaveURL('/concepts')

  await page.click('text=Latest')

  await expect(page).toHaveURL('/concepts')

  await page.waitForSelector('[role="gridcell"]')
})

test('open creation modal via card click', async ({ page }) => {
  await page.goto('/concepts')

  await expect(page).toHaveURL('/concepts')

  await page.click('text=Latest')
  await page.locator('[role="gridcell"]').first().click()
  await expect(page).toHaveURL(new RegExp('/*.concepts/'))
  await expect(page.getByTestId('concept-detail')).toBeInViewport()
})
