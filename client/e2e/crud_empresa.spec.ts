import { test, expect } from '@playwright/test';

test('admin pode criar, editar e deletar empresa', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.goto('/companies');
  await page.click('button:has-text("Nova Empresa")');
  await page.fill('input[name="name"]', 'Empresa E2E CRUD');
  await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
  await page.click('button:has-text("Salvar")');
  await expect(page.locator('text=Empresa E2E CRUD')).toBeVisible();

  await page.click('button:has-text("Editar")');
  await page.fill('input[name="name"]', 'Empresa E2E CRUD Editada');
  await page.click('button:has-text("Salvar")');
  await expect(page.locator('text=Empresa E2E CRUD Editada')).toBeVisible();

  await page.click('button:has-text("Deletar")');
  await page.click('button:has-text("Confirmar")');
  await expect(page.locator('text=Empresa E2E CRUD Editada')).not.toBeVisible();
});
