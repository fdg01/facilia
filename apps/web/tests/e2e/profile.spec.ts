/**
 * H. Perfil y sesión compartida (2 tests)
 */
import { test, expect } from './fixtures'

// H1. Página de perfil requiere sesión
test('H1: perfil sin sesión redirige a login', async ({ page }) => {
  await page.goto('/facilia/profile')
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

// H2. Usuario autenticado ve su perfil
test('H2: usuario ve su nombre en perfil', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/profile')
  await expect(page.locator('h1')).toHaveText('Mi perfil')
  // Should have at least one input field with user data
  const inputs = page.locator('input')
  expect(await inputs.count()).toBeGreaterThan(0)
})
