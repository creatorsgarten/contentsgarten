import test, { expect } from '@playwright/test'
import { randomUUID } from 'crypto'

test('Can view the main page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'MainPage' })).toBeVisible()
})

test('Can edit a page', async ({ page }) => {
  const id = randomUUID()
  const content = randomUUID()
  await page.goto('/wiki/Playground/' + id)
  await page.getByRole('button', { name: 'Edit this page' }).click()
  await page.getByRole('textbox').fill(content)
  await page.getByRole('button', { name: 'Save' }).click()

  // Once saving is finished, the save button should disappear
  await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()

  // The new page content should be visible
  await expect(page.getByText(content)).toBeVisible()
})
