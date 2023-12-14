import { expect, test } from '@playwright/test'

test('navigate to homepage - creations feed', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')

  await page.waitForSelector('.ant-empty')

  await page.click('text=Latest')
  await page.waitForSelector('[role="gridcell"]')

  await page.click('text=Popular')
  await page.waitForSelector('[role="gridcell"]')
})

test('open creation modal via card click', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')

  await page.click('text=Latest')
  await page.locator('[role="gridcell"]').first().click()
  await expect(page).toHaveURL(new RegExp('/*.creations/'))
  await expect(page.getByTestId('creation-detail')).toBeInViewport()
})
