import { expect, test } from '@playwright/test'

test('open via card click', async ({ page }) => {
  await page.goto('')

  await expect(page).toHaveURL('/')

  await page.click('text=Latest')
  await page.locator('[role="gridcell"]').first().click()
  await expect(page).toHaveURL(new RegExp('/*.creations/'))
  await expect(page.getByTestId('creation-detail')).toBeInViewport()
})
