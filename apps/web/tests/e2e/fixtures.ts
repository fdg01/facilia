/**
 * Shared fixtures for FACILIA E2E tests.
 *
 * Provides login helpers for each role (admin, employee, client).
 * Uses the browser Supabase client (same as the real login form) to
 * establish a session, then navigates to the target page.
 *
 * The admin seed has must_change_password=true. The fixture handles
 * the password change flow if redirected to /change-password.
 */
import { test as base, type Page, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@facilia.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'ChangeMe123!'
const EMPLOYEE_EMAIL = process.env.E2E_EMPLOYEE_EMAIL || 'employee.test@facilia.com'
const EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD || 'TempPass123!'
const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL || 'client.test@facilia.com'
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD || 'TempPass123!'

/**
 * Login via the browser Supabase client (same as the real form).
 * Sets auth cookies in the browser context.
 */
async function doLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/facilia/login')
  await page.waitForSelector('input#email', { state: 'visible', timeout: 15_000 })
  await page.fill('input#email', email)
  await page.fill('input#password', password)
  await page.click('button[type=submit]')
  // Wait for the auth request to complete and navigation to happen
  // The form does router.push + router.refresh, which may land on
  // change-password, admin, portal, field, or back to login
  await page.waitForTimeout(2000)
}

/**
 * Handle the must_change_password redirect if present.
 */
async function handlePasswordChangeIfNeeded(page: Page, currentPassword: string): Promise<void> {
  if (page.url().includes('change-password')) {
    await page.waitForSelector('input#current', { state: 'visible', timeout: 15_000 })
    await page.fill('input#current', currentPassword)
    await page.fill('input#new', currentPassword)
    await page.fill('input#confirm', currentPassword)
    await page.click('button[type=submit]')
    await page.waitForTimeout(2000)
  }
}

type Fixtures = {
  adminLogin: (page: Page) => Promise<void>
  employeeLogin: (page: Page) => Promise<void>
  clientLogin: (page: Page) => Promise<void>
}

export const test = base.extend<Fixtures>({
  adminLogin: async ({}, provide) => {
    const login = async (page: Page) => {
      await doLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD)
      await handlePasswordChangeIfNeeded(page, ADMIN_PASSWORD)
    }
    await provide(login)
  },

  employeeLogin: async ({}, provide) => {
    const login = async (page: Page) => {
      await doLogin(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
    }
    await provide(login)
  },

  clientLogin: async ({}, provide) => {
    const login = async (page: Page) => {
      await doLogin(page, CLIENT_EMAIL, CLIENT_PASSWORD)
      await handlePasswordChangeIfNeeded(page, CLIENT_PASSWORD)
    }
    await provide(login)
  },
})

export { expect }
