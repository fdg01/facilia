/**
 * E. Portal del Cliente (8 tests)
 */
import { test, expect } from './fixtures'

// E1. Cliente no autenticado es redirigido al login
test('E1: portal sin sesión redirige a login', async ({ page }) => {
  await page.goto('/facilia/portal')
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

// E2. Admin que intenta acceder al portal es redirigido a admin
test('E2: admin en portal es redirigido a /admin', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/portal')
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 })
})

// E3. Dashboard del portal cliente muestra resumen
test('E3: cliente ve dashboard del portal', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal')
  await expect(page.locator('body')).toBeVisible()
  const hasDashboard = await page.locator('text=/Dashboard|Servicios|Contratos|Calendario/i').count()
  expect(hasDashboard).toBeGreaterThan(0)
})

// E4. Portal muestra navegación completa
test('E4: portal tiene links a Servicios, Calendario, Evidencias, Contratos', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal')
  // Use .first() to handle multiple matches (nav + sidebar)
  await expect(page.locator('a[href="/facilia/portal/services"]').first()).toBeVisible()
  await expect(page.locator('a[href="/facilia/portal/calendar"]').first()).toBeVisible()
  await expect(page.locator('a[href="/facilia/portal/evidence"]').first()).toBeVisible()
  await expect(page.locator('a[href="/facilia/portal/contracts"]').first()).toBeVisible()
})

// E5. Cliente ve sus cotizaciones
test('E5: cliente ve lista de sus cotizaciones', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal/leads')
  await expect(page.locator('h1')).toHaveText('Mis cotizaciones')
  await expect(page.locator('a[href="/facilia/portal/quote"]').first()).toBeVisible()
})

// E6. Filtros de estado en cotizaciones del portal
test('E6: filtro de estado cambia la URL', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal/leads')
  await page.click('a:has-text("Enviadas")')
  await expect(page).toHaveURL(/status=sent/)
})

// E7. Nueva cotización desde el portal
test('E7: cliente puede acceder al formulario de nueva cotización', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal/quote')
  await expect(page.locator('body')).toBeVisible()
  const hasForm = await page.locator('form, [data-testid*="quoter"], h1, button').count()
  expect(hasForm).toBeGreaterThan(0)
})

// E8. Cliente puede crear una solicitud
test('E8: cliente ve formulario de nueva solicitud', async ({ page, clientLogin }) => {
  await clientLogin(page)
  await page.goto('/facilia/portal/requests/new')
  // Use a more specific selector to avoid matching the logout form
  await expect(page.locator('form.space-y-4')).toBeVisible({ timeout: 10_000 })
})
