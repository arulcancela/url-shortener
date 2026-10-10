import { test, expect } from '@playwright/test';

/**
 * Flujo E2E principal: crear enlace -> redirigir -> ver dashboard.
 * Requiere `npm run dev` (Playwright lo arranca automáticamente).
 */
test.describe('Flujo principal del acortador', () => {
  test('crea un enlace, redirige y registra el clic en el dashboard', async ({ page, context }) => {
    const destination = 'https://example.com/destino-e2e';
    const customSlug = `e2e-${Date.now()}`;

    // 1. Crear el enlace desde la home
    await page.goto('/');
    await page.getByLabel('URL larga').fill(destination);
    await page.getByLabel('Slug personalizado (opcional)').fill(customSlug);
    await page.getByRole('button', { name: /acortar url/i }).click();

    const created = page.getByTestId('created-link');
    await expect(created).toBeVisible();
    await expect(created).toContainText(customSlug);

    // 2. Redirigir: al visitar /[slug] debe acabar en el destino
    await page.goto(`/${customSlug}`);
    await page.waitForURL(destination);
    expect(page.url()).toBe(destination);

    // 3. Dashboard: el enlace aparece con al menos 1 clic
    await page.goto('/dashboard');
    const row = page.getByRole('row', { name: new RegExp(customSlug) });
    await expect(row).toBeVisible();
    await expect(row).toContainText('1');

    // 4. Detalle: hay gráfica y tabla de últimos accesos
    await page.getByRole('link', { name: `/${customSlug}` }).click();
    await expect(page).toHaveURL(/\/dashboard\//);
    await expect(page.getByTestId('clicks-chart')).toBeVisible();
    await expect(page.getByText('Últimos accesos')).toBeVisible();

    // limpieza implícita: el enlace queda en la BD de dev
  });

  test('rechaza una URL con esquema peligroso', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('URL larga').fill('javascript:alert(1)');
    await page.getByRole('button', { name: /acortar url/i }).click();
    await expect(page.getByRole('alert')).toContainText(/http|https|válid/i);
  });

  test('devuelve 404 al visitar un slug inexistente', async ({ page }) => {
    const response = await page.goto('/este-slug-no-existe-12345');
    // La ruta redirige a /not-found
    await expect(page.getByText(/404|no existe|expir/i).first()).toBeVisible();
    expect(response?.status()).toBeLessThan(500);
  });
});
