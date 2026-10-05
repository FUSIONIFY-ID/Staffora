import { test, expect } from '@playwright/test'
test('bootstrap shell loads', async ({ page }) => { await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Foundation in place.') })
