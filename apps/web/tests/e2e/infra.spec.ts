/**
 * A. Configuración e infraestructura (5 tests)
 */
import { test, expect } from '@playwright/test'

const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

// A1. La app responde en el basePath correcto
test('A1: la home carga bajo /facilia', async ({ page }) => {
  await page.goto('/facilia/')
  await expect(page.locator('body')).toBeVisible()
  // Should not be a 404 page
  const h1 = page.locator('h1')
  await expect(h1).toBeVisible()
})

// A2. Ruta sin basePath devuelve 404
test('A2: ruta raíz sin basePath no sirve la app', async ({ request }) => {
  const res = await request.get('http://localhost:3000/')
  // Next.js with basePath returns 404 for paths outside the prefix
  expect([404, 200]).toContain(res.status())
  if (res.status() === 200) {
    // If it returns 200, it should be a Next.js 404 page, not the app
    const text = await res.text()
    expect(text).not.toContain('Cotizador FACILIA')
  }
})

// A3. Assets estáticos se sirven bajo /facilia/_next/
test('A3: assets _next se sirven con basePath', async ({ page }) => {
  // Navigate to the app first so Next.js generates the asset manifest
  await page.goto('/facilia/')
  // Check that the page loaded CSS or JS from /facilia/_next/
  const scriptSrc = await page.locator('script[src*="/facilia/_next/"]').first().getAttribute('src')
  expect(scriptSrc).toBeTruthy()
  // Verify the asset is actually accessible
  const res = await page.request.get(`http://localhost:3000${scriptSrc}`)
  expect(res.status()).toBe(200)
})

// A4. Supabase Auth responde en /auth/v1/health via Kong
test('A4: Supabase auth health responde 200 con apikey', async ({ request }) => {
  const res = await request.get('http://localhost:8000/auth/v1/health', {
    headers: { apikey: ANON_KEY },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toHaveProperty('name')
})

// A5. PostgREST responde con service_role key
test('A5: PostgREST devuelve datos con service role', async ({ request }) => {
  const res = await request.get('http://localhost:8000/rest/v1/users?select=id&limit=1', {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.length).toBeGreaterThan(0)
})
