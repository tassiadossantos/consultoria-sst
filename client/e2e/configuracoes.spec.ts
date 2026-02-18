import { test, expect } from '@playwright/test';

// Teste E2E: fluxo de configurações

test('admin pode acessar e salvar configurações', async ({ page }) => {
  // Login como admin
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Acessa página de configurações
  await page.goto('/configuracoes');
  await expect(page.locator('h1')).toHaveText('Configurações');

  // Preenche campos
  await page.fill('input[name="company_name"]', 'Empresa E2E');
  await page.fill('input[name="company_cnpj"]', '12.345.678/0001-99');
  await page.fill('input[name="company_email"]', 'e2e@empresa.com');
  await page.selectOption('select[name="password_policy"]', '10');
  await page.selectOption('select[name="token_expiration"]', '60');
  await page.selectOption('select[name="training_frequency"]', 'Trimestral');
  await page.selectOption('select[name="alert_days"]', '15');

  // Salva configurações
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Configurações salvas com sucesso!')).toBeVisible();
});
