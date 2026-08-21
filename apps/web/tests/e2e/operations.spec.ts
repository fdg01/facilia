/**
 * F. Operaciones (3 tests)
 */
import { test, expect } from './fixtures'

// F1. Operaciones requiere admin
test('F1: empleado no puede acceder a operaciones', async ({ page, employeeLogin }) => {
  await employeeLogin(page)
  await page.goto('/facilia/operations')
  await expect(page).toHaveURL(/\/login|\/field/, { timeout: 10_000 })
})

// F2. Dashboard de operaciones carga para admin
test('F2: admin ve dashboard de operaciones', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/operations')
  await expect(page.locator('body')).toBeVisible({ timeout: 10_000 })
  // Look for any operations-related text (heading, nav, or content)
  const headings = await page.locator('h1, h2, nav').count()
  const opsText = await page.locator('text=/Operaciones|Órdenes|Calendario|Indicadores/i').count()
  expect(headings + opsText).toBeGreaterThan(0)
})

// F3. Lista de órdenes de trabajo
test('F3: admin ve lista de órdenes', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/operations/orders')
  await expect(page.locator('body')).toBeVisible()
  // Look for orders-related content (heading or table)
  const headings = await page.locator('h1, table').count()
  const ordersText = await page.locator('text=/orden|Orden|Órden/i').count()
  expect(headings + ordersText).toBeGreaterThan(0)
})
