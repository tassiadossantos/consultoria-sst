import { test, expect } from '@playwright/test';

test('admin pode criar e visualizar treinamento', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.goto('/trainings');
  await page.click('button:has-text("Novo Treinamento")');
  await page.fill('input[name="title"]', 'Treinamento E2E');
  await page.fill('input[name="instructor"]', 'Instrutor E2E');
  await page.click('button:has-text("Salvar")');
  await expect(page.locator('text=Treinamento E2E')).toBeVisible();
});
