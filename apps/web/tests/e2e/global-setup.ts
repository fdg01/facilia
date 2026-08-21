/**
 * Global setup: ensures test users (employee, client) exist before running E2E.
 *
 * Creates them via the admin API using the seeded admin credentials.
 * Also creates a test organization for the client.
 *
 * Idempotent: if users already exist, skips creation.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'

const EMPLOYEE_EMAIL = 'employee.test@facilia.com'
const EMPLOYEE_PASSWORD = 'TempPass123!'
const CLIENT_EMAIL = 'client.test@facilia.com'
const CLIENT_PASSWORD = 'TempPass123!'

export default async function globalSetup() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Check if test organization exists, create if not
  const { data: existingOrgs } = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', 'Test Org E2E')
    .limit(1)

  let orgId: string

  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org E2E' })
      .select()
      .single()

    if (orgError) throw new Error(`Failed to create test org: ${orgError.message}`)
    orgId = newOrg.id
  }

  // 2. Check if employee exists
  const { data: existingEmployee } = await supabase
    .from('users')
    .select('id')
    .eq('email', EMPLOYEE_EMAIL)
    .maybeSingle()

  if (!existingEmployee) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMPLOYEE_EMAIL,
      password: EMPLOYEE_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Employee', last_name: 'Test', role: 'employee' },
    })

    if (authError) throw new Error(`Failed to create employee auth: ${authError.message}`)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: 'Employee',
        last_name: 'Test',
        role: 'employee',
        must_change_password: false,
      })
      .eq('auth_id', authData.user.id)

    if (updateError) throw new Error(`Failed to update employee: ${updateError.message}`)
  }

  // 3. Check if client exists
  const { data: existingClient } = await supabase
    .from('users')
    .select('id')
    .eq('email', CLIENT_EMAIL)
    .maybeSingle()

  if (!existingClient) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: 'Client',
        last_name: 'Test',
        role: 'client',
        organization_id: orgId,
      },
    })

    if (authError) throw new Error(`Failed to create client auth: ${authError.message}`)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        must_change_password: false,
      })
      .eq('auth_id', authData.user.id)

    if (updateError) throw new Error(`Failed to update client: ${updateError.message}`)
  }

  // Store credentials in env for tests to use
  process.env.E2E_EMPLOYEE_EMAIL = EMPLOYEE_EMAIL
  process.env.E2E_EMPLOYEE_PASSWORD = EMPLOYEE_PASSWORD
  process.env.E2E_CLIENT_EMAIL = CLIENT_EMAIL
  process.env.E2E_CLIENT_PASSWORD = CLIENT_PASSWORD
  process.env.E2E_TEST_ORG_ID = orgId

  console.log('[global-setup] Test users ready')
}
