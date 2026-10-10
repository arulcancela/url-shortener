import { test, expect } from '@playwright/test';

/**
 * Flujo E2E principal: crear enlace -> redirigir -> ver dashboard.
 * Playwright arranca `npm run dev` automáticamente (ver playwright.config.ts).
 *
 * Nota sobre la hidratación: el formulario usa estado de React, así que hay
 * que esperar a que la página esté completamente cargada (`waitUntil: 'networkidle'`)
 * antes de rellenar campos, o los valores se pierden al montar el componente.
 */
test.describe('Flujo principal del acortador', () => {
  test.beforeEach(async ({ page }) => {
    // Espera a que la hidratación termine para evitar perder los `fill()`.
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('crea un enlace, redirige y registra el clic en el dashboard', async ({ page }) => {
    const destination = 'https://example.com/destino-e2e';
    const customSlug = `e2e-${Date.now()}`;

    // 1. Crear el enlace desde la home
    const urlInput = page.getByLabel('URL larga');
    await urlInput.click();
    await urlInput.fill(destination);
    const slugInput = page.getByLabel('Slug personalizado (opcional)');
    await slugInput.click();
    await slugInput.fill(customSlug);

    // Verifica que React registró los valores (input controlado).
    await expect(urlInput).toHaveValue(destination);
    await expect(slugInput).toHaveValue(customSlug);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/links') && res.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /acortar url/i }).click(),
    ]);
    expect(response.status()).toBe(201);

    const created = page.getByTestId('created-link');
    await expect(created).toBeVisible();
    await expect(created).toContainText(customSlug);

    // 2. Redirigir: al visitar /[slug] debe acabar en el destino
    await page.goto(`/${customSlug}`);
    await page.waitForURL(destination);
    expect(page.url()).toBe(destination);

    // 3. Dashboard: el enlace aparece con al menos 1 clic
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const row = page.getByRole('row', { name: new RegExp(customSlug) });
    await expect(row).toBeVisible();
    await expect(row).toContainText('1');

    // 4. Detalle: hay gráfica y tabla de últimos accesos
    await page.getByRole('link', { name: `/${customSlug}` }).click();
    await expect(page).toHaveURL(/\/dashboard\//);
    await expect(page.getByTestId('clicks-chart')).toBeVisible();
    await expect(page.getByText('Últimos accesos')).toBeVisible();
  });

  test('rechaza una URL con esquema peligroso', async ({ page }) => {
    const urlInput = page.getByLabel('URL larga');
    await urlInput.click();
    await urlInput.fill('javascript:alert(1)');
    await expect(urlInput).toHaveValue('javascript:alert(1)');

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/links') && res.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /acortar url/i }).click(),
    ]);

    // La API debe rechazarla con 400 y un mensaje que mencione http/https.
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/http|https|válid/i);

    // Y la UI muestra el error al usuario.
    await expect(page.getByText(/Solo se permiten URLs/i)).toBeVisible();
  });

  test('devuelve 404 al visitar un slug inexistente', async ({ page }) => {
    const response = await page.goto('/este-slug-no-existe-12345');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/404|no existe|expir/i).first()).toBeVisible();
  });
});
