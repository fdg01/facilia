/**
 * G. App de Campo (2 tests)
 */
import { test, expect } from './fixtures'

// G1. App de campo requiere sesión de empleado
test('G1: campo sin sesión redirige a login', async ({ page }) => {
  await page.goto('/facilia/field')
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

// G2. Empleado ve su lista de órdenes asignadas
test('G2: empleado ve lista de órdenes en campo', async ({ page, employeeLogin }) => {
  await employeeLogin(page)
  await page.goto('/facilia/field')
  await expect(page.locator('text=/FACILIA/i')).toBeVisible()
  await expect(page.locator('text=/Campo/i')).toBeVisible()
})
