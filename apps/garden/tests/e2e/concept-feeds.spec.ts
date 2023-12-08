import { expect, test } from '@playwright/test'

test('homepage - concepts feeds', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('nav-explore-concepts').click()

  await expect(page).toHaveURL('/concepts')

  await page.click('text=Latest')

  await expect(page).toHaveURL('/concepts')

  await page.waitForSelector('[role="gridcell"]')
})
