// NODE_ENV=test/build/ci =>  use yarn dev:dummy!!!
import { expect, test } from '@playwright/test'

test('open settings dropdown', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')

  await page.getByTestId('settings-dropdown-trigger').click()
  await page.getByTestId('theme-toggle-button').isVisible()
})

test('toggle dark mode on', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')

  await page.getByTestId('settings-dropdown-trigger').click()
  await page.getByTestId('theme-toggle-button').click()
  await page.waitForSelector('.dark')
})
