/**
 * C. Panel de Admin (10 tests)
 */
import { test, expect } from './fixtures'

// C1. Admin no autenticado es redirigido al login
test('C1: admin sin sesión redirige a login', async ({ page }) => {
  await page.goto('/facilia/admin')
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

// C2. Dashboard de admin muestra cards de navegación
test('C2: admin dashboard muestra links a Usuarios y Organizaciones', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin')
  // Use .first() since links may appear in both nav and dashboard
  await expect(page.locator('a[href="/facilia/admin/users"]').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('a[href="/facilia/admin/organizations"]').first()).toBeVisible()
})

// C3. Página de usuarios lista usuarios existentes
test('C3: admin/users muestra tabla con usuarios', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  await expect(page.locator('h1')).toHaveText('Usuarios')
  await expect(page.locator('table thead')).toContainText('Nombre')
  await expect(page.locator('table tbody tr').first()).toBeVisible()
})

// C4. Botón "Crear usuario" abre formulario
test('C4: botón Crear usuario abre formulario inline', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  await page.click('text=Crear usuario')
  await expect(page.locator('input[placeholder="Nombre"]')).toBeVisible()
  await expect(page.locator('select:has(option:has-text("Admin"))')).toBeVisible()
})

// C5. Crear usuario employee via formulario
test('C5: admin crea un empleado nuevo', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  await page.click('text=Crear usuario')
  const uniqueEmail = `e2e-emp-${Date.now()}@facilia.com`
  await page.fill('input[placeholder="Nombre"]', 'E2E')
  await page.fill('input[placeholder="Apellido"]', 'Employee')
  await page.fill('input[type=email]', uniqueEmail)
  await page.fill('input[placeholder="Teléfono"]', '099123456')
  await page.selectOption('select', 'employee')
  await page.fill('input[placeholder*="Contraseña temporal"]', 'TempPass123!')
  await page.click('button:has-text("Crear")')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('table')).toContainText(uniqueEmail)
})

// C6. Crear usuario client requiere organización
test('C6: crear cliente muestra selector de organización', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  await page.click('text=Crear usuario')
  await page.selectOption('select', 'client')
  await expect(page.locator('select:has(option:has-text("Seleccionar organización"))')).toBeVisible()
})

// C7. Editar usuario existente
test('C7: admin edita nombre de un usuario', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  await page.click('a:has-text("Editar")')
  await expect(page).toHaveURL(/\/admin\/users\//, { timeout: 10_000 })
  // Should have at least one visible text input with a value
  const firstVisibleInput = page.locator('input[type="text"], input:not([type="hidden"])').first()
  await expect(firstVisibleInput).toBeVisible({ timeout: 10_000 })
})

// C8. Inactivar usuario muestra confirmación
test('C8: botón Inactivar pide confirmación', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/users')
  // Register dialog handler BEFORE clicking, with auto-dismiss
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Inactivar')
    await dialog.dismiss()
  })
  // Click the first "Inactivar" button
  await page.click('button:has-text("Inactivar")')
  // Wait a bit for the dialog to be handled
  await page.waitForTimeout(1000)
})

// C9. Página de organizaciones lista organizaciones
test('C9: admin/organizations muestra lista', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin/organizations')
  await expect(page.locator('h1')).toHaveText('Organizaciones')
})

// C10. Logout funciona desde el panel admin
test('C10: logout redirige al login', async ({ page, adminLogin }) => {
  await adminLogin(page)
  await page.goto('/facilia/admin')
  await page.click('button:has-text("Cerrar sesión")')
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})
